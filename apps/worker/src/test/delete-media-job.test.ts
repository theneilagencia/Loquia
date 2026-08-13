import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { schema, type Database } from '@loquia/api/db';
import type { ObjectStorageProvider } from '@loquia/pipeline';
import { processJob } from '../process-job';
import { makeMockStorage, makeWorkerDeps, makeWorkerTestDb, seedProcessable, truncateAll } from './helpers';

const { processingJobs, mediaAssets, transcriptSegments } = schema;

let db: Database;
let close: () => Promise<void>;
const storage = makeMockStorage();

beforeAll(async () => {
  const h = await makeWorkerTestDb();
  db = h.db;
  close = h.close;
});
afterAll(async () => {
  await close();
});
beforeEach(async () => {
  await truncateAll(db);
});

/** Seed a meeting whose transcript is already persisted and whose remote copy is pending deletion. */
async function seedPendingDeletion(): Promise<{ meetingId: string; mediaAssetId: string; deleteJobId: string; objectKey: string }> {
  const fx = await seedProcessable(db, storage);
  // Transcript exists (Local First deletes media only after transcript persists).
  await db.insert(transcriptSegments).values({ workspaceId: fx.workspaceId, meetingId: fx.meetingId, speakerKey: 's1', orderIndex: 0, sequence: 0, startSeconds: 0, endSeconds: 1, text: 'oi', language: 'pt-BR' });
  const asset = (await db.select().from(mediaAssets).where(eq(mediaAssets.id, fx.mediaAssetId)))[0]!;
  await db.update(mediaAssets).set({ status: 'deletion_pending' }).where(eq(mediaAssets.id, fx.mediaAssetId));
  const [delJob] = await db
    .insert(processingJobs)
    .values({ workspaceId: fx.workspaceId, meetingId: fx.meetingId, mediaAssetId: fx.mediaAssetId, type: 'delete_processing_media', status: 'queued', stage: 'ready_for_ai_pack', progress: 0 })
    .returning();
  return { meetingId: fx.meetingId, mediaAssetId: fx.mediaAssetId, deleteJobId: delJob!.id, objectKey: asset.objectKey };
}

describe('delete_processing_media job (Local First)', () => {
  it('deletes the remote object, marks the asset deleted, and keeps the transcript', async () => {
    const { meetingId, mediaAssetId, deleteJobId, objectKey } = await seedPendingDeletion();
    expect((await storage.headObject(objectKey)).exists).toBe(true);

    const res = await processJob(makeWorkerDeps(db, storage), deleteJobId);
    expect(res.status).toBe('completed');

    const asset = (await db.select().from(mediaAssets).where(eq(mediaAssets.id, mediaAssetId)))[0]!;
    expect(asset.status).toBe('deleted');
    expect(asset.deletedAt).not.toBeNull();
    expect((await storage.headObject(objectKey)).exists).toBe(false);
    // Transcript is untouched.
    const segs = await db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, meetingId));
    expect(segs.length).toBeGreaterThan(0);
    const job = (await db.select().from(processingJobs).where(eq(processingJobs.id, deleteJobId)))[0]!;
    expect(job.status).toBe('completed');
  });

  it('on storage failure marks the asset delete_failed, requeues, and never touches the transcript', async () => {
    const { meetingId, mediaAssetId, deleteJobId } = await seedPendingDeletion();

    // A storage whose delete always throws (R2 down).
    const failing: ObjectStorageProvider = {
      name: 'mock',
      createUploadUrl: async () => ({ url: '', method: 'PUT', headers: {}, expiresAt: '' }),
      createDownloadUrl: async () => ({ url: '', expiresAt: '' }),
      headObject: async () => ({ exists: true }),
      getObject: async () => new Uint8Array(),
      deleteObject: async () => { throw new Error('R2 down'); },
    };

    await expect(processJob(makeWorkerDeps(db, failing as never), deleteJobId)).rejects.toThrow('R2 down');

    const asset = (await db.select().from(mediaAssets).where(eq(mediaAssets.id, mediaAssetId)))[0]!;
    expect(asset.status).toBe('delete_failed');
    const job = (await db.select().from(processingJobs).where(eq(processingJobs.id, deleteJobId)))[0]!;
    expect(job.status).toBe('queued'); // retryable
    expect(job.errorCode).toBe('remote_delete_failed');
    // Transcript preserved despite the failed remote cleanup.
    const segs = await db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, meetingId));
    expect(segs.length).toBeGreaterThan(0);
  });

  it('is a no-op when the asset is already deleted', async () => {
    const { mediaAssetId, deleteJobId } = await seedPendingDeletion();
    await db.update(mediaAssets).set({ status: 'deleted', deletedAt: new Date() }).where(eq(mediaAssets.id, mediaAssetId));
    const res = await processJob(makeWorkerDeps(db, storage), deleteJobId);
    expect(res.status).toBe('completed');
    expect(res.reason).toBe('nothing_to_delete');
  });
});
