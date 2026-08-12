import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { Queue, Worker } from 'bullmq';
import { schema, type Database } from '@loquia/api/db';
import { createRedis, MEETING_QUEUE, MockTranscriptionAdapter, type MeetingJobData } from '@loquia/pipeline';
import { processJob } from '../process-job';
import { makeMockStorage, makeWorkerTestDb, noopLog, seedProcessable, truncateAll } from './helpers';

const REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:6380';
const { processingJobs, transcriptSegments } = schema;

let db: Database;
let close: () => Promise<void>;
const storage = makeMockStorage();
const transcription = new MockTranscriptionAdapter();

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

describe('BullMQ queue → worker (real Redis)', () => {
  it('enqueues a job and the worker consumes it, persisting the transcript', async () => {
    const fx = await seedProcessable(db, storage);

    const queueConn = createRedis(REDIS_URL);
    const queue = new Queue(MEETING_QUEUE, { connection: queueConn });
    await queue.obliterate({ force: true });

    const worker = new Worker<MeetingJobData>(
      MEETING_QUEUE,
      async (job) => {
        await processJob({ db, storage, transcription, log: noopLog }, job.data.processingJobId);
      },
      { connection: createRedis(REDIS_URL), concurrency: 1 },
    );

    try {
      await queue.add('process', { processingJobId: fx.jobId }, { jobId: fx.jobId });

      // Wait until the DB job is completed.
      const deadline = Date.now() + 15_000;
      let status = 'queued';
      while (Date.now() < deadline) {
        const row = (await db.select().from(processingJobs).where(eq(processingJobs.id, fx.jobId)))[0];
        status = row?.status ?? 'queued';
        if (status === 'completed' || status === 'failed') break;
        await new Promise((r) => setTimeout(r, 200));
      }
      expect(status).toBe('completed');
      const segs = await db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, fx.meetingId));
      expect(segs.length).toBeGreaterThan(0);
    } finally {
      await worker.close();
      await queue.close();
      queueConn.disconnect();
    }
  });
});
