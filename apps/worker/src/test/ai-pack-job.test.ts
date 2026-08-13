import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { and, eq, inArray } from 'drizzle-orm';
import { schema, type Database } from '@loquia/api/db';
import { resolvePack, type PackSource } from '@loquia/domain';
import { MockAIPackGenerator, PipelineError, type AIPackGenerator } from '@loquia/pipeline';
import { processJob } from '../process-job';
import { makeMockStorage, makeWorkerDeps, makeWorkerTestDb, seedProcessable, truncateAll } from './helpers';

const { processingJobs, meetings, aiPacks } = schema;

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

/** Run the transcription job, then run the enqueued ai_pack job. */
async function runFullPipeline(gen?: AIPackGenerator): Promise<{ meetingId: string; aiPackJobId: string }> {
  const fx = await seedProcessable(db, storage);
  const enqueued: string[] = [];
  await processJob(makeWorkerDeps(db, storage, { generator: gen ?? new MockAIPackGenerator(), enqueue: async (id) => void enqueued.push(id) }), fx.jobId);
  // Local First: transcription enqueues BOTH the ai_pack job and the remote-cleanup job.
  expect(enqueued).toHaveLength(2);
  const jobs = await db.select().from(processingJobs).where(inArray(processingJobs.id, enqueued));
  const aiPackJobId = jobs.find((j) => j.type === 'ai_pack')!.id;
  expect(jobs.some((j) => j.type === 'delete_processing_media')).toBe(true);
  await processJob(makeWorkerDeps(db, storage, { generator: gen ?? new MockAIPackGenerator() }), aiPackJobId);
  return { meetingId: fx.meetingId, aiPackJobId };
}

describe('ai_pack job', () => {
  it('generates, persists a current version, and resolves to a real AI Pack', async () => {
    const { meetingId } = await runFullPipeline();

    const meeting = (await db.select().from(meetings).where(eq(meetings.id, meetingId)))[0]!;
    expect(meeting.aiPackStatus).toBe('ready');

    const rows = await db.select().from(aiPacks).where(and(eq(aiPacks.meetingId, meetingId), eq(aiPacks.isCurrent, true)));
    expect(rows).toHaveLength(1);
    const pack = rows[0]!;
    expect(pack.version).toBe(1);
    expect(pack.provider).toBe('mock');
    expect(pack.promptVersion).toBeTruthy();
    expect(pack.schemaVersion).toBeTruthy();

    const resolved = resolvePack({ meetingId, sections: pack.sourceSections as PackSource['sections'] }, 'pt-BR');
    expect(resolved.sections.some((s) => s.key === 'metadata')).toBe(true);
    expect(resolved.sections.some((s) => s.lines.length > 0)).toBe(true);
  });

  it('is idempotent: re-running the same completed job creates no second version', async () => {
    const { meetingId, aiPackJobId } = await runFullPipeline();
    const again = await processJob(makeWorkerDeps(db, storage), aiPackJobId);
    expect(again.status).toBe('skipped');
    const all = await db.select().from(aiPacks).where(eq(aiPacks.meetingId, meetingId));
    expect(all).toHaveLength(1);
  });

  it('regeneration keeps the old version until the new one completes, then swaps current', async () => {
    const { meetingId } = await runFullPipeline();

    // Enqueue a fresh ai_pack job (regenerate) and run it.
    const meeting = (await db.select().from(meetings).where(eq(meetings.id, meetingId)))[0]!;
    const [regen] = await db
      .insert(processingJobs)
      .values({ workspaceId: meeting.workspaceId, meetingId, type: 'ai_pack', status: 'queued', stage: 'ready_for_ai_pack', progress: 0 })
      .returning();
    await processJob(makeWorkerDeps(db, storage), regen!.id);

    const all = await db.select().from(aiPacks).where(eq(aiPacks.meetingId, meetingId));
    expect(all).toHaveLength(2); // history preserved
    const current = all.filter((p) => p.isCurrent);
    expect(current).toHaveLength(1); // exactly one current
    expect(current[0]!.version).toBe(2);
  });

  it('a failed generation preserves the transcript and marks aiPackStatus failed', async () => {
    const failing: AIPackGenerator = {
      name: 'boom',
      model: 'boom-1',
      async generate() {
        throw new PipelineError('unsupported_media', 'nope'); // permanent
      },
    };
    const { meetingId } = { meetingId: (await seedAndTranscribe()).meetingId };

    async function seedAndTranscribe() {
      const fx = await seedProcessable(db, storage);
      const enqueued: string[] = [];
      await processJob(makeWorkerDeps(db, storage, { enqueue: async (id) => void enqueued.push(id) }), fx.jobId);
      return { meetingId: fx.meetingId, aiPackJobId: enqueued[0]! };
    }

    // Grab the enqueued ai_pack job for this meeting and run it with a failing generator.
    const aiJob = (await db.select().from(processingJobs).where(and(eq(processingJobs.meetingId, meetingId), eq(processingJobs.type, 'ai_pack'))))[0]!;
    await expect(processJob(makeWorkerDeps(db, storage, { generator: failing }), aiJob.id)).rejects.toThrow();

    const meeting = (await db.select().from(meetings).where(eq(meetings.id, meetingId)))[0]!;
    expect(meeting.aiPackStatus).toBe('failed');
    expect(meeting.status).toBe('ready'); // transcript preserved
    const packs = await db.select().from(aiPacks).where(eq(aiPacks.meetingId, meetingId));
    expect(packs).toHaveLength(0);
  });
});
