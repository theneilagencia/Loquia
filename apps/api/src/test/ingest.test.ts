import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { meetings, processingJobs, transcriptSegments } from '../db/schema';
import { createUser, createWorkspace, login, makeTestApp, truncateAll, type TestApp } from './helpers';

let t: TestApp;
beforeAll(async () => { t = await makeTestApp(); });
afterAll(async () => { await t.close(); });
beforeEach(async () => { await truncateAll(t.db); });

async function ownerCookie(name = 'Org') {
  const ws = await createWorkspace(t.db, name);
  await createUser(t.db, { email: `owner@${name.toLowerCase()}.com`, workspaceId: ws, role: 'owner' });
  return { cookie: await login(t.app, `owner@${name.toLowerCase()}.com`), ws };
}

/** Poll a meeting until it reaches a terminal status (ready/failed) or times out. */
async function waitForStatus(meetingId: string, target: 'ready' | 'failed', ms = 4000): Promise<string> {
  const deadline = Date.now() + ms;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const m = (await t.db.select().from(meetings).where(eq(meetings.id, meetingId)))[0];
    if (m && (m.status === target || m.status === 'ready' || m.status === 'failed')) return m.status;
    if (Date.now() > deadline) return m?.status ?? 'missing';
    await new Promise((r) => setTimeout(r, 50));
  }
}

describe('direct audio ingest (M5.2 — no object storage)', () => {
  it('accepts a raw audio body, transcribes in-process, persists the transcript and queues AI Pack', async () => {
    const { cookie } = await ownerCookie();
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/meetings/process-audio?title=Sales%20call&meetingLanguage=pt-BR&source=recording&durationSeconds=42',
      headers: { cookie, 'content-type': 'audio/webm' },
      payload: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
    });
    expect(res.statusCode).toBe(202);
    const { meetingId, processingJobId } = res.json();
    expect(meetingId).toBeTruthy();
    expect(processingJobId).toBeTruthy();

    // The detached ingest runs the mock transcription and persists a transcript.
    const status = await waitForStatus(meetingId, 'ready');
    expect(status).toBe('ready');

    const segs = await t.db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, meetingId));
    expect(segs.length).toBeGreaterThan(0);

    // The transcription job completed and an ai_pack job was enqueued (no storage anywhere).
    const txJob = (await t.db.select().from(processingJobs).where(eq(processingJobs.id, processingJobId)))[0]!;
    expect(txJob.status).toBe('completed');
    const aiJobs = await t.db.select().from(processingJobs).where(and(eq(processingJobs.meetingId, meetingId), eq(processingJobs.type, 'ai_pack')));
    expect(aiJobs).toHaveLength(1);
  });

  it('rejects an empty body', async () => {
    const { cookie } = await ownerCookie('Empty');
    const res = await t.app.inject({ method: 'POST', url: '/api/meetings/process-audio?title=x', headers: { cookie, 'content-type': 'audio/webm' }, payload: Buffer.alloc(0) });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.details.code).toBe('empty_audio');
  });

  it('reprocess (§13/§39) starts a new attempt for an existing meeting; workspace-isolated', async () => {
    const { cookie } = await ownerCookie('Reproc');
    const first = await t.app.inject({ method: 'POST', url: '/api/meetings/process-audio?title=Retry%20me&source=recording', headers: { cookie, 'content-type': 'audio/webm' }, payload: Buffer.from([1, 2, 3, 4]) });
    const { meetingId } = first.json();
    await waitForStatus(meetingId, 'ready');

    const re = await t.app.inject({ method: 'POST', url: `/api/meetings/${meetingId}/process-audio`, headers: { cookie, 'content-type': 'audio/webm' }, payload: Buffer.from([9, 8, 7, 6]) });
    expect(re.statusCode).toBe(202);
    expect(re.json().meetingId).toBe(meetingId);

    // Another workspace cannot reprocess this meeting.
    const b = await ownerCookie('Other');
    const denied = await t.app.inject({ method: 'POST', url: `/api/meetings/${meetingId}/process-audio`, headers: { cookie: b.cookie, 'content-type': 'audio/webm' }, payload: Buffer.from([1]) });
    expect(denied.statusCode).toBe(404);
  });
});
