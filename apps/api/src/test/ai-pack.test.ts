import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { aiPacks, meetings, processingJobs, transcriptSegments } from '../db/schema';
import { createUser, createWorkspace, login, makeTestApp, truncateAll, type TestApp } from './helpers';

let h: TestApp;

beforeAll(async () => {
  h = await makeTestApp();
});
afterAll(async () => {
  await h.close();
});
beforeEach(async () => {
  await truncateAll(h.db);
});

async function seedReadyMeeting(workspaceId: string, ownerId: string): Promise<string> {
  const [m] = await h.db
    .insert(meetings)
    .values({ workspaceId, ownerId, title: 'Reunião', source: 'upload', status: 'ready', meetingLanguage: 'pt-BR', detectedLanguage: 'pt-BR', durationSeconds: 60, participantCount: 2, aiPackStatus: 'not_started' })
    .returning();
  await h.db.insert(transcriptSegments).values([
    { workspaceId, meetingId: m!.id, speakerKey: 'sp1', orderIndex: 0, sequence: 0, startSeconds: 0, endSeconds: 5, text: 'Bom dia a todos.', language: 'pt-BR' },
    { workspaceId, meetingId: m!.id, speakerKey: 'sp2', orderIndex: 1, sequence: 1, startSeconds: 6, endSeconds: 12, text: 'A decisão é focar no orçamento de R$ 120 mil.', language: 'pt-BR' },
  ]);
  return m!.id;
}

describe('AI Pack endpoints', () => {
  it('reports honest status, generates and regenerates (async), and reads the current version', async () => {
    const ws = await createWorkspace(h.db);
    const uid = await createUser(h.db, { email: 'a@acme.com', workspaceId: ws, role: 'owner' });
    const cookie = await login(h.app, 'a@acme.com');
    const meetingId = await seedReadyMeeting(ws, uid);

    // No pack yet.
    const s0 = await h.app.inject({ method: 'GET', url: `/api/meetings/${meetingId}/ai-pack/status`, headers: { cookie } });
    expect(s0.statusCode).toBe(200);
    expect(s0.json()).toMatchObject({ status: 'not_started', hasCurrent: false });

    // Generate → creates a queued ai_pack job and flips the meeting status.
    const g = await h.app.inject({ method: 'POST', url: `/api/meetings/${meetingId}/ai-pack/generate`, headers: { cookie } });
    expect(g.statusCode).toBe(200);
    expect(g.json().type).toBe('ai_pack');
    const meeting = (await h.db.select().from(meetings).where(eq(meetings.id, meetingId)))[0]!;
    expect(meeting.aiPackStatus).toBe('queued');
    const jobs = await h.db.select().from(processingJobs).where(and(eq(processingJobs.meetingId, meetingId), eq(processingJobs.type, 'ai_pack')));
    expect(jobs).toHaveLength(1);

    // Calling generate again reuses the in-flight job (no duplicates).
    await h.app.inject({ method: 'POST', url: `/api/meetings/${meetingId}/ai-pack/generate`, headers: { cookie } });
    expect((await h.db.select().from(processingJobs).where(and(eq(processingJobs.meetingId, meetingId), eq(processingJobs.type, 'ai_pack')))).length).toBe(1);

    // Simulate the worker persisting a current version.
    await h.db.insert(aiPacks).values({ workspaceId: ws, meetingId, version: 1, isCurrent: true, status: 'ready', outputLanguage: 'pt-BR', provider: 'mock', model: 'mock-aipack-1', promptVersion: 'p1', schemaVersion: 'aipack-1', generationKey: jobs[0]!.id, sourceSections: [{ key: 'purpose', confidence: 'inferred', lines: [{ pt: 'Objetivo', en: 'Purpose' }] }] });
    await h.db.update(meetings).set({ aiPackStatus: 'ready' }).where(eq(meetings.id, meetingId));

    const s1 = await h.app.inject({ method: 'GET', url: `/api/meetings/${meetingId}/ai-pack/status`, headers: { cookie } });
    expect(s1.json()).toMatchObject({ status: 'ready', hasCurrent: true, version: 1, provider: 'mock' });

    const pack = await h.app.inject({ method: 'GET', url: `/api/meetings/${meetingId}/aipack`, headers: { cookie } });
    expect(pack.json().source.sections[0].key).toBe('purpose');

    // Regenerate → always a NEW job.
    const r = await h.app.inject({ method: 'POST', url: `/api/meetings/${meetingId}/ai-pack/regenerate`, headers: { cookie } });
    expect(r.statusCode).toBe(200);
    expect((await h.db.select().from(processingJobs).where(and(eq(processingJobs.meetingId, meetingId), eq(processingJobs.type, 'ai_pack')))).length).toBe(2);
  });

  it('refuses to generate before the transcript is ready', async () => {
    const ws = await createWorkspace(h.db);
    const uid = await createUser(h.db, { email: 'b@acme.com', workspaceId: ws, role: 'owner' });
    const cookie = await login(h.app, 'b@acme.com');
    const [m] = await h.db.insert(meetings).values({ workspaceId: ws, ownerId: uid, title: 'X', source: 'upload', status: 'processing', meetingLanguage: 'pt-BR', durationSeconds: 0, participantCount: 0 }).returning();
    const g = await h.app.inject({ method: 'POST', url: `/api/meetings/${m!.id}/ai-pack/generate`, headers: { cookie } });
    expect(g.statusCode).toBe(400);
  });

  it('enforces workspace isolation on every AI Pack endpoint', async () => {
    const wsA = await createWorkspace(h.db, 'A');
    const ownerA = await createUser(h.db, { email: 'oa@a.com', workspaceId: wsA, role: 'owner' });
    const meetingId = await seedReadyMeeting(wsA, ownerA);

    const wsB = await createWorkspace(h.db, 'B');
    await createUser(h.db, { email: 'ob@b.com', workspaceId: wsB, role: 'owner' });
    const cookieB = await login(h.app, 'ob@b.com');

    for (const url of [`/api/meetings/${meetingId}/ai-pack/status`, `/api/meetings/${meetingId}/aipack`]) {
      const res = await h.app.inject({ method: 'GET', url, headers: { cookie: cookieB } });
      expect(res.statusCode).toBe(404);
    }
    for (const url of [`/api/meetings/${meetingId}/ai-pack/generate`, `/api/meetings/${meetingId}/ai-pack/regenerate`]) {
      const res = await h.app.inject({ method: 'POST', url, headers: { cookie: cookieB } });
      expect(res.statusCode).toBe(404);
    }
  });
});
