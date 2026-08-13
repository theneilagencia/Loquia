import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { schema, type Database } from '@loquia/api/db';
import {
  PipelineError,
  type TranscriptionInput,
  type TranscriptionProvider,
  type TranscriptionResult,
} from '@loquia/pipeline';
import { processJob } from '../process-job';
import { makeMockStorage, makeWorkerDeps, makeWorkerTestDb, seedProcessable, truncateAll } from './helpers';

const { processingJobs, meetings, transcriptSegments, mediaAssets } = schema;

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

describe('processJob — happy path', () => {
  it('transcribes, segments and persists a real transcript; marks the pipeline ready_for_ai_pack', async () => {
    const fx = await seedProcessable(db, storage);
    const result = await processJob(makeWorkerDeps(db, storage), fx.jobId);
    expect(result.status).toBe('completed');

    const job = (await db.select().from(processingJobs).where(eq(processingJobs.id, fx.jobId)))[0]!;
    expect(job.status).toBe('completed');
    expect(job.stage).toBe('ready_for_ai_pack'); // AI Pack NOT executed
    expect(job.provider).toBe('mock');

    const meeting = (await db.select().from(meetings).where(eq(meetings.id, fx.meetingId)))[0]!;
    expect(meeting.status).toBe('ready');
    expect(meeting.detectedLanguage).toBeTruthy();
    expect(meeting.participantCount).toBeGreaterThanOrEqual(2);

    const segs = await db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, fx.meetingId));
    expect(segs.length).toBeGreaterThan(0);
    expect(segs.every((s) => typeof s.startMs === 'number' && s.startMs! >= 0)).toBe(true);
    // Local First: the temporary remote copy is now marked for deletion, and a
    // delete_processing_media job was created + enqueued alongside the ai_pack job.
    const asset = (await db.select().from(mediaAssets).where(eq(mediaAssets.id, fx.mediaAssetId)))[0]!;
    expect(asset.status).toBe('deletion_pending');
    const delJobs = await db.select().from(processingJobs).where(and(eq(processingJobs.meetingId, fx.meetingId), eq(processingJobs.type, 'delete_processing_media')));
    expect(delJobs).toHaveLength(1);
    expect(delJobs[0]!.status).toBe('queued');
  });
});

describe('idempotency', () => {
  it('re-processing does not duplicate segments and a completed job is a no-op', async () => {
    const fx = await seedProcessable(db, storage);
    await processJob(makeWorkerDeps(db, storage), fx.jobId);
    const firstCount = (await db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, fx.meetingId))).length;

    // Re-deliver the same completed job → skipped, no changes.
    const again = await processJob(makeWorkerDeps(db, storage), fx.jobId);
    expect(again.status).toBe('skipped');
    const secondCount = (await db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, fx.meetingId))).length;
    expect(secondCount).toBe(firstCount);

    // Force a reprocess (reset to queued) → segments replaced, not duplicated.
    await db.update(processingJobs).set({ status: 'queued' }).where(eq(processingJobs.id, fx.jobId));
    await processJob(makeWorkerDeps(db, storage), fx.jobId);
    const thirdCount = (await db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, fx.meetingId))).length;
    expect(thirdCount).toBe(firstCount);
  });
});

describe('retry classification', () => {
  const failing = (category: 'network' | 'unsupported_media'): TranscriptionProvider => ({
    name: 'failing',
    async transcribe(_input: TranscriptionInput): Promise<TranscriptionResult> {
      throw new PipelineError(category, `boom-${category}`);
    },
  });

  it('a transient error re-queues the job (retryable)', async () => {
    const fx = await seedProcessable(db, storage);
    await expect(processJob(makeWorkerDeps(db, storage, { transcription: failing('network') }), fx.jobId)).rejects.toThrow();
    const job = (await db.select().from(processingJobs).where(eq(processingJobs.id, fx.jobId)))[0]!;
    expect(job.status).toBe('queued'); // will be retried
    expect(job.errorCode).toBe('network');
    const meeting = (await db.select().from(meetings).where(eq(meetings.id, fx.meetingId)))[0]!;
    expect(meeting.status).toBe('processing'); // not failed
  });

  it('a permanent error fails the job and the meeting', async () => {
    const fx = await seedProcessable(db, storage);
    await expect(processJob(makeWorkerDeps(db, storage, { transcription: failing('unsupported_media') }), fx.jobId)).rejects.toThrow();
    const job = (await db.select().from(processingJobs).where(eq(processingJobs.id, fx.jobId)))[0]!;
    expect(job.status).toBe('failed');
    expect(job.errorCode).toBe('unsupported_media');
    const meeting = (await db.select().from(meetings).where(eq(meetings.id, fx.meetingId)))[0]!;
    expect(meeting.status).toBe('failed');
  });
});
