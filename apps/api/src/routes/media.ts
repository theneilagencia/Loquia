import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import {
  ACCEPTED_MIME,
  generateObjectKey,
  MockStorageAdapter,
  validateUpload,
} from '@loquia/pipeline';
import { mediaAssets, meetings, processingJobs } from '../db/schema';
import { toProcessingJobDTO } from '../dto';
import { requireAuth, assertWorkspace } from '../context';
import { errors } from '../lib/errors';
import { newId } from '../lib/crypto';
import { assertActiveJobLimit, assertDurationLimit } from '../services/quotas';
import { computeRetention, ownerStoreAudio } from '../services/retention';

export async function registerMediaRoutes(app: FastifyInstance): Promise<void> {
  const { db, env, storage, enqueue } = app.ctx;

  // Raw-body parsers so the mock storage PUT can receive binary media.
  for (const mime of [...ACCEPTED_MIME, 'application/octet-stream']) {
    if (!app.hasContentTypeParser(mime)) {
      app.addContentTypeParser(mime, { parseAs: 'buffer' }, (_req, body, done) => done(null, body));
    }
  }

  const intentSchema = z.object({
    title: z.string().min(1),
    meetingLanguage: z.string().default('pt-BR'),
    source: z.enum(['recording', 'upload']).default('upload'),
    filename: z.string().min(1),
    mimeType: z.string(),
    sizeBytes: z.number().int().positive().optional(),
    /** Optional client-known duration hint (recorder); enforced against the quota. */
    durationSeconds: z.number().int().nonnegative().optional(),
  });

  // Create the meeting + a pending MediaAsset and return a presigned PUT URL.
  app.post(
    '/api/meetings/upload-intent',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (request) => {
      const auth = requireAuth(request.auth);
      const input = intentSchema.parse(request.body);

      const validation = validateUpload({ mimeType: input.mimeType, sizeBytes: input.sizeBytes, maxBytes: env.MAX_UPLOAD_SIZE_BYTES });
      if (!validation.ok) throw errors.badRequest(validation.message ?? 'Invalid upload', { code: validation.code });

      // Operational quotas (protection, not billing).
      assertDurationLimit(env, input.durationSeconds);
      await assertActiveJobLimit(db, env, auth.user.workspaceId);

      const [meeting] = await db
        .insert(meetings)
        .values({ workspaceId: auth.user.workspaceId, ownerId: auth.user.id, title: input.title, source: input.source, status: 'processing', meetingLanguage: input.meetingLanguage, durationSeconds: 0, participantCount: 0 })
        .returning();

      const mediaAssetId = newId();
      const bucket = env.R2_BUCKET_NAME ?? 'mock';
      const objectKey = generateObjectKey({ workspaceId: auth.user.workspaceId, meetingId: meeting!.id, mediaAssetId, filename: input.filename, mimeType: input.mimeType });

      await db.insert(mediaAssets).values({
        id: mediaAssetId,
        workspaceId: auth.user.workspaceId,
        meetingId: meeting!.id,
        storageProvider: storage.name,
        bucket,
        objectKey,
        originalFilename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        status: 'pending_upload',
      });

      const presigned = await storage.createUploadUrl({ objectKey, contentType: input.mimeType, sizeBytes: input.sizeBytes, ttlSeconds: env.MEDIA_UPLOAD_URL_TTL_SECONDS });

      request.log.info({ event: 'processing_job_created', meetingId: meeting!.id, workspaceId: auth.user.workspaceId, mediaAssetId }, 'upload intent');
      return { meetingId: meeting!.id, mediaAssetId, uploadUrl: presigned.url, requiredHeaders: presigned.headers, expiresAt: presigned.expiresAt };
    },
  );

  // Confirm the upload: HEAD the object, then create + enqueue the ProcessingJob.
  app.post(
    '/api/media/:id/complete',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (request) => {
      const auth = requireAuth(request.auth);
      const { id } = request.params as { id: string };
      const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
      const asset = rows[0];
      if (!asset) throw errors.notFound();
      assertWorkspace(auth, asset.workspaceId);

      const stat = await storage.headObject(asset.objectKey);
      if (!stat.exists || !stat.sizeBytes || stat.sizeBytes <= 0) {
        throw errors.badRequest('Uploaded object not found or empty', { code: 'upload_not_found' });
      }
      const overMax = stat.sizeBytes > env.MAX_UPLOAD_SIZE_BYTES;
      if (overMax) throw errors.badRequest('Uploaded object too large', { code: 'file_too_large' });

      // Retention: derive from the meeting owner's privacy setting + deployment default.
      const meetingRow = (await db.select().from(meetings).where(eq(meetings.id, asset.meetingId)).limit(1))[0];
      const uploadedAt = new Date();
      const storeAudio = meetingRow ? await ownerStoreAudio(db, meetingRow.ownerId) : true;
      const retention = computeRetention(env, storeAudio, uploadedAt);

      const job = await db.transaction(async (tx) => {
        await tx.update(mediaAssets).set({ status: 'uploaded', sizeBytes: stat.sizeBytes, uploadedAt, retentionPolicy: retention.retentionPolicy, expiresAt: retention.expiresAt }).where(eq(mediaAssets.id, id));
        const [created] = await tx
          .insert(processingJobs)
          .values({ workspaceId: asset.workspaceId, meetingId: asset.meetingId, mediaAssetId: asset.id, type: 'media_processing', status: 'queued', stage: 'received', progress: 0 })
          .returning();
        return created!;
      });

      await enqueue(job.id);
      request.log.info({ event: 'media_upload_completed', meetingId: asset.meetingId, workspaceId: asset.workspaceId, processingJobId: job.id }, 'upload completed, enqueued');
      return toProcessingJobDTO(job);
    },
  );

  // Short-lived audio URL for playback (private bucket).
  app.get('/api/meetings/:id/audio-url', async (request) => {
    const auth = requireAuth(request.auth);
    const { id } = request.params as { id: string };
    const meetingRows = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
    if (!meetingRows[0]) throw errors.notFound();
    assertWorkspace(auth, meetingRows[0].workspaceId);
    const assetRows = await db.select().from(mediaAssets).where(eq(mediaAssets.meetingId, id)).orderBy(desc(mediaAssets.createdAt)).limit(1);
    const asset = assetRows[0];
    if (!asset || asset.status === 'pending_upload' || asset.status === 'deleted') return { url: null };
    const presigned = await storage.createDownloadUrl({ objectKey: asset.objectKey, ttlSeconds: env.MEDIA_DOWNLOAD_URL_TTL_SECONDS });
    return { url: presigned.url, expiresAt: presigned.expiresAt };
  });

  // Mock storage endpoint (only active when the storage provider is the mock).
  if (storage instanceof MockStorageAdapter) {
    const mock = storage;
    app.put('/api/_mock-storage', async (request, reply) => {
      const { key } = z.object({ key: z.string() }).parse(request.query);
      const contentType = (request.headers['content-type'] as string) ?? 'application/octet-stream';
      const body = request.body as Buffer | undefined;
      if (!body || !Buffer.isBuffer(body)) throw errors.badRequest('Missing body');
      mock.putObjectSync(key, new Uint8Array(body), contentType);
      return reply.status(200).send({ ok: true });
    });
    app.get('/api/_mock-storage', async (request, reply) => {
      const { key } = z.object({ key: z.string() }).parse(request.query);
      const stat = await mock.headObject(key);
      if (!stat.exists) return reply.status(404).send({ error: 'not_found' });
      const bytes = await mock.getObject(key);
      return reply.header('content-type', stat.contentType ?? 'application/octet-stream').send(Buffer.from(bytes));
    });
  }
}
