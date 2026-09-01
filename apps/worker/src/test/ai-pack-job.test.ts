import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { schema, type Database } from '@loquia/api/db';
import { resolvePack, type PackSource } from '@loquia/domain';
import { PipelineError, type AIPackGenerator } from '@loquia/pipeline';
import { processJob } from '@loquia/api/jobs';
import { makeWorkerDeps, makeWorkerTestDb, seedAiPackReady, truncateAll } from './helpers';

const { processingJobs, meetings, transcriptSegments, aiPacks } = schema;

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

describe('ai_pack job (M5.2 — worker only does AI Pack)', () => {
  it('generates, persists a current version, and resolves to a real AI Pack', async () => {
    const { meetingId, aiPackJobId } = await seedAiPackReady(db);
    await processJob(makeWorkerDeps(db), aiPackJobId);

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
    const { meetingId, aiPackJobId } = await seedAiPackReady(db);
    await processJob(makeWorkerDeps(db), aiPackJobId);
    const again = await processJob(makeWorkerDeps(db), aiPackJobId);
    expect(again.status).toBe('skipped');
    const all = await db.select().from(aiPacks).where(eq(aiPacks.meetingId, meetingId));
    expect(all).toHaveLength(1);
  });

  it('regeneration keeps the old version until the new one completes, then swaps current', async () => {
    const { meetingId, workspaceId, aiPackJobId } = await seedAiPackReady(db);
    await processJob(makeWorkerDeps(db), aiPackJobId);

    const [regen] = await db
      .insert(processingJobs)
      .values({ workspaceId, meetingId, type: 'ai_pack', status: 'queued', stage: 'ready_for_ai_pack', progress: 0 })
      .returning();
    await processJob(makeWorkerDeps(db), regen!.id);

    const all = await db.select().from(aiPacks).where(eq(aiPacks.meetingId, meetingId));
    expect(all).toHaveLength(2); // history preserved
    const current = all.filter((p) => p.isCurrent);
    expect(current).toHaveLength(1);
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
    const { meetingId, aiPackJobId } = await seedAiPackReady(db);
    await expect(processJob(makeWorkerDeps(db, { generator: failing }), aiPackJobId)).rejects.toThrow();

    const meeting = (await db.select().from(meetings).where(eq(meetings.id, meetingId)))[0]!;
    expect(meeting.aiPackStatus).toBe('failed');
    // Transcript is untouched by a failed AI Pack.
    const segs = await db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, meetingId));
    expect(segs.length).toBeGreaterThan(0);
    // No pack persisted.
    expect((await db.select().from(aiPacks).where(eq(aiPacks.meetingId, meetingId)))).toHaveLength(0);
  });

  it('a retryable error re-queues until maxAttempts, then fails (never loops forever)', async () => {
    // A persistently-retryable provider error (e.g. repeated timeouts on a long
    // transcript) must not re-queue forever and strand the meeting in "generating".
    const flaky: AIPackGenerator = {
      name: 'flaky',
      model: 'flaky-1',
      async generate() {
        throw new PipelineError('provider_timeout', 'timed out'); // retryable
      },
    };
    const { meetingId, aiPackJobId } = await seedAiPackReady(db);
    const deps = makeWorkerDeps(db, { generator: flaky });

    // maxAttempts defaults to 3 → attempts 1 and 2 re-queue (meeting stays
    // "generating"), attempt 3 exhausts and marks the job + meeting failed.
    await expect(processJob(deps, aiPackJobId)).rejects.toThrow();
    let job = (await db.select().from(processingJobs).where(eq(processingJobs.id, aiPackJobId)))[0]!;
    expect(job.status).toBe('queued');
    expect(job.attempt).toBe(2);
    expect((await db.select().from(meetings).where(eq(meetings.id, meetingId)))[0]!.aiPackStatus).toBe('generating');

    await expect(processJob(deps, aiPackJobId)).rejects.toThrow();
    job = (await db.select().from(processingJobs).where(eq(processingJobs.id, aiPackJobId)))[0]!;
    expect(job.status).toBe('queued');
    expect(job.attempt).toBe(3);

    await expect(processJob(deps, aiPackJobId)).rejects.toThrow();
    job = (await db.select().from(processingJobs).where(eq(processingJobs.id, aiPackJobId)))[0]!;
    expect(job.status).toBe('failed');
    expect(job.attempt).toBe(4);
    expect((await db.select().from(meetings).where(eq(meetings.id, meetingId)))[0]!.aiPackStatus).toBe('failed');
  });

  it('skips a job whose type is not ai_pack (transcription is done in the API now)', async () => {
    const { workspaceId, meetingId } = await seedAiPackReady(db);
    const [legacy] = await db.insert(processingJobs).values({ workspaceId, meetingId, type: 'transcription', status: 'queued', stage: 'received', progress: 0 }).returning();
    const res = await processJob(makeWorkerDeps(db), legacy!.id);
    expect(res.status).toBe('skipped');
  });
});
