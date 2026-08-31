import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { schema, type Database } from '@loquia/api/db';
import { createInProcessRunner } from '@loquia/api/jobs';
import { makeWorkerDeps, makeWorkerTestDb, seedAiPackReady, truncateAll } from './helpers';

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

async function jobStatus(id: string): Promise<string> {
  const row = (await db.select().from(processingJobs).where(eq(processingJobs.id, id)))[0];
  return row?.status ?? 'missing';
}

/**
 * The Render free plan has no separate worker and no Redis: the API drains
 * ai_pack jobs from Postgres itself. These tests cover that in-process path.
 */
describe('in-process AI Pack runner (no Redis)', () => {
  it('start() reconciles a queued job left behind and persists the AI Pack', async () => {
    const fx = await seedAiPackReady(db);
    const runner = createInProcessRunner(makeWorkerDeps(db), { pollMs: 60_000 });
    try {
      await runner.start(); // startup reconcile drains the queued job to completion
      expect(await jobStatus(fx.aiPackJobId)).toBe('completed');
      const packs = await db.select().from(aiPacks).where(eq(aiPacks.meetingId, fx.meetingId));
      expect(packs.length).toBe(1);
      expect(packs[0]!.isCurrent).toBe(true);
    } finally {
      await runner.stop();
    }
  });

  it('kick() triggers a non-blocking drain that completes the job', async () => {
    const fx = await seedAiPackReady(db);
    const runner = createInProcessRunner(makeWorkerDeps(db), { pollMs: 60_000 });
    try {
      runner.kick(); // fire-and-forget, like the Deepgram callback path
      const deadline = Date.now() + 10_000;
      while (Date.now() < deadline && (await jobStatus(fx.aiPackJobId)) !== 'completed') {
        await new Promise((r) => setTimeout(r, 100));
      }
      expect(await jobStatus(fx.aiPackJobId)).toBe('completed');
    } finally {
      await runner.stop();
    }
  });
});
