import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { Queue, Worker } from 'bullmq';
import { schema, type Database } from '@loquia/api/db';
import { createRedis, MEETING_QUEUE, type MeetingJobData } from '@loquia/pipeline';
import { processJob } from '@loquia/api/jobs';
import { makeWorkerDeps, makeWorkerTestDb, seedAiPackReady, truncateAll } from './helpers';

const REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:6380';
const { processingJobs, aiPacks } = schema;

let db: Database;
let close: () => Promise<void>;

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
  it('enqueues an ai_pack job and the worker consumes it, persisting the AI Pack', async () => {
    const fx = await seedAiPackReady(db);

    const queueConn = createRedis(REDIS_URL);
    const queue = new Queue(MEETING_QUEUE, { connection: queueConn });
    await queue.obliterate({ force: true });

    const worker = new Worker<MeetingJobData>(
      MEETING_QUEUE,
      async (job) => {
        await processJob(makeWorkerDeps(db), job.data.processingJobId);
      },
      { connection: createRedis(REDIS_URL), concurrency: 1 },
    );

    try {
      await queue.add('process', { processingJobId: fx.aiPackJobId }, { jobId: fx.aiPackJobId });

      const deadline = Date.now() + 15_000;
      let status = 'queued';
      while (Date.now() < deadline) {
        const row = (await db.select().from(processingJobs).where(eq(processingJobs.id, fx.aiPackJobId)))[0];
        status = row?.status ?? 'queued';
        if (status === 'completed' || status === 'failed') break;
        await new Promise((r) => setTimeout(r, 200));
      }
      expect(status).toBe('completed');
      const packs = await db.select().from(aiPacks).where(eq(aiPacks.meetingId, fx.meetingId));
      expect(packs.length).toBe(1);
    } finally {
      await worker.close();
      await queue.close();
      queueConn.disconnect();
    }
  });
});
