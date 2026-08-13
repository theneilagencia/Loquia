import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { Readable } from 'node:stream';
import { ACCEPTED_MIME } from '@loquia/pipeline';
import { meetings, processingJobs } from '../db/schema';
import { requireAuth, assertWorkspace } from '../context';
import { errors } from '../lib/errors';
import { newId } from '../lib/crypto';
import { assertActiveJobLimit, assertDurationLimit } from '../services/quotas';
import { submitForTranscription } from '../services/ingest';
import { streamToTempFile, removeTempFile, UploadTooLargeError } from '../services/temp-media';

/**
 * Direct audio ingest routes (Milestone 5.2, async callback model). The browser
 * sends the on-device recording as a raw audio body (streaming, never base64
 * §16). The API submits it to the transcription provider WITH a callback URL and
 * returns immediately — no long work runs after the response (§1). The provider
 * later POSTs the result to the webhook below.
 */
export async function registerIngestRoutes(app: FastifyInstance): Promise<void> {
  const { db, env, transcription, enqueue } = app.ctx;

  // Stream audio bodies straight to a temp file (bounded), instead of buffering
  // the whole file in memory (§17). The parsed body is { tempPath, sizeBytes }.
  const audioMimes = [...ACCEPTED_MIME, 'application/octet-stream'];
  for (const mime of audioMimes) {
    if (!app.hasContentTypeParser(mime)) {
      app.addContentTypeParser(mime, (_req, payload: Readable, done) => {
        streamToTempFile(payload, newId(), env.MAX_UPLOAD_SIZE_BYTES)
          .then((r) => done(null, { tempPath: r.path, sizeBytes: r.sizeBytes }))
          .catch((err) => {
            if (err instanceof UploadTooLargeError) {
              done(Object.assign(new Error('Uploaded audio too large'), { statusCode: 413, code: 'file_too_large' }));
              return;
            }
            done(err as Error);
          });
      });
    }
  }

  const metaSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    meetingLanguage: z.string().default('pt-BR'),
    source: z.enum(['recording', 'upload']).default('recording'),
    filename: z.string().min(1).max(200).default('recording.webm'),
    durationSeconds: z.coerce.number().int().nonnegative().optional(),
  });

  function parseBody(body: unknown): { tempPath: string; sizeBytes: number } {
    const b = body as { tempPath?: string; sizeBytes?: number } | undefined;
    if (!b || typeof b.tempPath !== 'string' || typeof b.sizeBytes !== 'number' || b.sizeBytes <= 0) {
      throw errors.badRequest('Missing or empty audio body', { code: 'empty_audio' });
    }
    return { tempPath: b.tempPath, sizeBytes: b.sizeBytes };
  }

  function contentType(headerValue: string | undefined): string {
    const mime = (headerValue ?? '').split(';')[0]!.trim().toLowerCase();
    if (!mime || mime === 'application/octet-stream') return 'audio/webm';
    return mime;
  }

  /** The callback URL the provider will POST the finished transcript to. */
  function callbackUrl(): string {
    const base = env.PUBLIC_API_URL ?? `http://localhost:${env.API_PORT}`;
    const token = env.DEEPGRAM_CALLBACK_SECRET ?? 'dev-callback-secret';
    return `${base}/api/webhooks/deepgram?token=${encodeURIComponent(token)}`;
  }

  /** Submit an audio temp file for an (already created) meeting + job, then respond. */
  async function submit(job: { id: string; meetingId: string; workspaceId: string }, tempPath: string, sizeBytes: number, mimeType: string, languageHint: string) {
    const outcome = await submitForTranscription(
      { db, transcription, enqueue, log: (event, fields) => app.log.info({ event, ...fields }, event) },
      { processingJobId: job.id, meetingId: job.meetingId, workspaceId: job.workspaceId, tempPath, mimeType, sizeBytes, languageHint: languageHint !== 'auto' ? languageHint : undefined, callbackUrl: callbackUrl() },
    );
    return outcome;
  }

  // Create a new meeting from a recording/upload and submit it for transcription.
  app.post(
    '/api/meetings/process-audio',
    { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const auth = requireAuth(request.auth);
      const meta = metaSchema.parse(request.query);
      const { tempPath, sizeBytes } = parseBody(request.body);
      const mimeType = contentType(request.headers['content-type']);
      try {
        assertDurationLimit(env, meta.durationSeconds);
        await assertActiveJobLimit(db, env, auth.user.workspaceId);
      } catch (err) {
        await removeTempFile(tempPath);
        throw err;
      }

      const [meeting] = await db.insert(meetings).values({ workspaceId: auth.user.workspaceId, ownerId: auth.user.id, title: meta.title || 'Nova gravação', source: meta.source, status: 'processing', meetingLanguage: meta.meetingLanguage, durationSeconds: meta.durationSeconds ?? 0, participantCount: 0 }).returning();
      const [job] = await db.insert(processingJobs).values({ workspaceId: auth.user.workspaceId, meetingId: meeting!.id, type: 'transcription', status: 'queued', stage: 'received', progress: 0 }).returning();

      const outcome = await submit({ id: job!.id, meetingId: meeting!.id, workspaceId: auth.user.workspaceId }, tempPath, sizeBytes, mimeType, meta.meetingLanguage);
      if (!outcome.ok) {
        return reply.status(502).send({ error: { code: 'stt_submission_failed', message: 'Could not submit audio for transcription', requestId: request.id, details: { category: outcome.category } } });
      }
      request.log.info({ event: 'processing_job_created', meetingId: meeting!.id, workspaceId: auth.user.workspaceId, processingJobId: job!.id, sizeBytes }, 'audio submitted for transcription');
      return reply.status(202).send({ meetingId: meeting!.id, processingJobId: job!.id });
    },
  );

  // Retry processing for an EXISTING meeting from the on-device recording (§9).
  app.post(
    '/api/meetings/:id/process-audio',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const auth = requireAuth(request.auth);
      const { id } = request.params as { id: string };
      const meta = metaSchema.parse(request.query);
      const { tempPath, sizeBytes } = parseBody(request.body);
      const mimeType = contentType(request.headers['content-type']);

      const rows = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
      const meeting = rows[0];
      if (!meeting) {
        await removeTempFile(tempPath);
        throw errors.notFound();
      }
      try {
        assertWorkspace(auth, meeting.workspaceId);
        assertDurationLimit(env, meta.durationSeconds);
        await assertActiveJobLimit(db, env, meeting.workspaceId);
      } catch (err) {
        await removeTempFile(tempPath);
        throw err;
      }

      await db.update(meetings).set({ status: 'processing', updatedAt: new Date() }).where(eq(meetings.id, id));
      const [job] = await db.insert(processingJobs).values({ workspaceId: meeting.workspaceId, meetingId: meeting.id, type: 'transcription', status: 'queued', stage: 'received', progress: 0 }).returning();

      const outcome = await submit({ id: job!.id, meetingId: meeting.id, workspaceId: meeting.workspaceId }, tempPath, sizeBytes, mimeType, meeting.meetingLanguage);
      if (!outcome.ok) {
        return reply.status(502).send({ error: { code: 'stt_submission_failed', message: 'Could not submit audio for transcription', requestId: request.id, details: { category: outcome.category } } });
      }
      request.log.info({ event: 'reprocess_accepted', meetingId: meeting.id, workspaceId: meeting.workspaceId, processingJobId: job!.id, sizeBytes }, 'reprocess submitted');
      return reply.status(202).send({ meetingId: meeting.id, processingJobId: job!.id });
    },
  );
}
