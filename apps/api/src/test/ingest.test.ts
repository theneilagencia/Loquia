import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { existsSync } from 'node:fs';
import { Readable } from 'node:stream';
import { MockTranscriptionAdapter } from '@loquia/pipeline';
import { streamToTempFile } from '../services/temp-media';
import { submitForTranscription } from '../services/ingest';
import { meetings, processingJobs, transcriptSegments } from '../db/schema';
import { createUser, createWorkspace, login, makeTestApp, truncateAll, type TestApp } from './helpers';

const CALLBACK_TOKEN = 'test-callback-secret';
let t: TestApp;
beforeAll(async () => { t = await makeTestApp(); });
afterAll(async () => { await t.close(); });
beforeEach(async () => { await truncateAll(t.db); });

async function ownerCookie(name = 'Org') {
  const ws = await createWorkspace(t.db, name);
  await createUser(t.db, { email: `owner@${name.toLowerCase()}.com`, workspaceId: ws, role: 'owner' });
  return { cookie: await login(t.app, `owner@${name.toLowerCase()}.com`), ws };
}

/** Submit audio for a new meeting; returns { meetingId, processingJobId }. */
async function submit(cookie: string, query = 'title=Sales%20call&meetingLanguage=pt-BR&source=recording&durationSeconds=42') {
  const res = await t.app.inject({ method: 'POST', url: `/api/meetings/process-audio?${query}`, headers: { cookie, 'content-type': 'audio/webm' }, payload: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]) });
  return res;
}

/** Post a provider callback for a job's providerRequestId. */
async function postCallback(providerRequestId: string, opts?: { token?: string; fail?: boolean; empty?: boolean; language?: string }) {
  const payload = MockTranscriptionAdapter.sampleCallbackPayload(providerRequestId, { language: opts?.language, fail: opts?.fail, empty: opts?.empty });
  return t.app.inject({ method: 'POST', url: `/api/webhooks/deepgram?token=${encodeURIComponent(opts?.token ?? CALLBACK_TOKEN)}`, headers: { 'content-type': 'application/json' }, payload });
}

async function jobRow(id: string) {
  return (await t.db.select().from(processingJobs).where(eq(processingJobs.id, id)))[0]!;
}

describe('direct audio ingest — async submission (M5.2)', () => {
  it('submits to the provider, persists the request id, marks submitted_to_stt, and keeps NO temp media', async () => {
    const { cookie } = await ownerCookie();
    const res = await submit(cookie);
    expect(res.statusCode).toBe(202);
    const { meetingId, processingJobId } = res.json();

    const job = await jobRow(processingJobId);
    expect(job.status).toBe('running'); // submitted; awaiting callback
    expect(job.stage).toBe('transcribing');
    expect(job.provider).toBe('mock');
    expect(job.providerRequestId).toMatch(/^mock-req-/);
    // The transcript does NOT exist yet (it arrives via callback).
    expect((await t.db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, meetingId)))).toHaveLength(0);
  });

  it('deletes the temp media after submission (§11) — no file survives', async () => {
    const ws = await createWorkspace(t.db, 'Temp');
    const uid = await createUser(t.db, { email: 'temp@acme.com', workspaceId: ws });
    const [m] = await t.db.insert(meetings).values({ workspaceId: ws, ownerId: uid, title: 'T', source: 'recording', status: 'processing', meetingLanguage: 'pt-BR', durationSeconds: 1, participantCount: 0 }).returning();
    const [job] = await t.db.insert(processingJobs).values({ workspaceId: ws, meetingId: m!.id, type: 'transcription', status: 'queued', stage: 'received', progress: 0 }).returning();
    const { path } = await streamToTempFile(Readable.from([Buffer.from([1, 2, 3, 4])]), 'ingest-unit-test', 1_000_000);
    expect(existsSync(path)).toBe(true);

    const outcome = await submitForTranscription(
      { db: t.db, transcription: new MockTranscriptionAdapter(), enqueue: async () => {}, log: () => {} },
      { processingJobId: job!.id, meetingId: m!.id, workspaceId: ws, tempPath: path, mimeType: 'audio/webm', sizeBytes: 4, callbackUrl: 'https://loquia.test/api/webhooks/deepgram?token=x' },
    );
    expect(outcome.ok).toBe(true);
    expect(existsSync(path)).toBe(false); // deleted in finally
    expect((await jobRow(job!.id)).providerRequestId).toMatch(/^mock-req-/);
  });

  it('callback maps the transcript, completes the job, and enqueues AI Pack exactly once', async () => {
    const { cookie } = await ownerCookie('Cb');
    const { meetingId, processingJobId } = (await submit(cookie)).json();
    const job = await jobRow(processingJobId);

    const cb = await postCallback(job.providerRequestId!);
    expect(cb.statusCode).toBe(200);
    expect(cb.json().status).toBe('completed');

    const meeting = (await t.db.select().from(meetings).where(eq(meetings.id, meetingId)))[0]!;
    expect(meeting.status).toBe('ready');
    expect((await t.db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, meetingId))).length).toBeGreaterThan(0);
    expect((await jobRow(processingJobId)).status).toBe('completed');
    const aiJobs = await t.db.select().from(processingJobs).where(and(eq(processingJobs.meetingId, meetingId), eq(processingJobs.type, 'ai_pack')));
    expect(aiJobs).toHaveLength(1);
  });

  it('a duplicate callback is idempotent — no second transcript or AI Pack job', async () => {
    const { cookie } = await ownerCookie('Dup');
    const { meetingId, processingJobId } = (await submit(cookie)).json();
    const reqId = (await jobRow(processingJobId)).providerRequestId!;

    expect((await postCallback(reqId)).json().status).toBe('completed');
    const second = await postCallback(reqId);
    expect(second.statusCode).toBe(200);
    expect(second.json().status).toBe('duplicate');

    expect((await t.db.select().from(processingJobs).where(and(eq(processingJobs.meetingId, meetingId), eq(processingJobs.type, 'ai_pack')))).length).toBe(1);
  });

  it('rejects an unauthorized callback token', async () => {
    const { cookie } = await ownerCookie('Auth');
    const { processingJobId } = (await submit(cookie)).json();
    const reqId = (await jobRow(processingJobId)).providerRequestId!;
    const res = await postCallback(reqId, { token: 'wrong-secret' });
    expect(res.statusCode).toBe(401);
    // The job stays un-completed.
    expect((await jobRow(processingJobId)).status).toBe('running');
  });

  it('rejects a callback for an unknown provider request id', async () => {
    const res = await postCallback('mock-req-does-not-exist');
    expect(res.statusCode).toBe(404);
  });

  it('a failure callback marks the job failed (needs_reupload) and preserves nothing bogus', async () => {
    const { cookie } = await ownerCookie('Fail');
    const { meetingId, processingJobId } = (await submit(cookie)).json();
    const reqId = (await jobRow(processingJobId)).providerRequestId!;

    const res = await postCallback(reqId, { fail: true });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('failed');
    const job = await jobRow(processingJobId);
    expect(job.status).toBe('failed');
    expect(job.errorCode).toBe('permanent'); // unsupported_media → permanent
    const meeting = (await t.db.select().from(meetings).where(eq(meetings.id, meetingId)))[0]!;
    expect(meeting.status).toBe('failed');
    expect((await t.db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, meetingId)))).toHaveLength(0);
  });

  it('a successful-but-empty transcription (silent recording) fails as no_speech and enqueues NO AI Pack', async () => {
    const { cookie } = await ownerCookie('Silent');
    const { meetingId, processingJobId } = (await submit(cookie)).json();
    const reqId = (await jobRow(processingJobId)).providerRequestId!;

    const res = await postCallback(reqId, { empty: true });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('failed');

    const job = await jobRow(processingJobId);
    expect(job.status).toBe('failed');
    expect(job.errorCode).toBe('no_speech');
    // The meeting must NOT read as ready — it is a clear failure the user can retry.
    const meeting = (await t.db.select().from(meetings).where(eq(meetings.id, meetingId)))[0]!;
    expect(meeting.status).toBe('failed');
    expect(meeting.participantCount).toBe(0);
    expect((await t.db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, meetingId)))).toHaveLength(0);
    // Crucially, no AI Pack job is created on an empty transcript.
    expect((await t.db.select().from(processingJobs).where(and(eq(processingJobs.meetingId, meetingId), eq(processingJobs.type, 'ai_pack'))))).toHaveLength(0);
  });

  it('reprocess (§9) starts a NEW submission for an existing meeting; workspace-isolated', async () => {
    const { cookie } = await ownerCookie('Reproc');
    const { meetingId, processingJobId } = (await submit(cookie)).json();
    const firstReqId = (await jobRow(processingJobId)).providerRequestId!;

    const re = await t.app.inject({ method: 'POST', url: `/api/meetings/${meetingId}/process-audio`, headers: { cookie, 'content-type': 'audio/webm' }, payload: Buffer.from([9, 8, 7, 6]) });
    expect(re.statusCode).toBe(202);
    const reJob = await jobRow(re.json().processingJobId);
    expect(reJob.providerRequestId).not.toBe(firstReqId); // new provider request id

    const other = await ownerCookie('Other');
    const denied = await t.app.inject({ method: 'POST', url: `/api/meetings/${meetingId}/process-audio`, headers: { cookie: other.cookie, 'content-type': 'audio/webm' }, payload: Buffer.from([1]) });
    expect(denied.statusCode).toBe(404);
  });

  it('rejects an empty body', async () => {
    const { cookie } = await ownerCookie('Empty');
    const res = await t.app.inject({ method: 'POST', url: '/api/meetings/process-audio?title=x', headers: { cookie, 'content-type': 'audio/webm' }, payload: Buffer.alloc(0) });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.details.code).toBe('empty_audio');
  });
});
