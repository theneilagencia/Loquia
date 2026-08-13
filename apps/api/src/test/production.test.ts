import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { MockTranscriptionAdapter } from '@loquia/pipeline';
import { buildApp } from '../app';
import type { AppContext } from '../context';
import { aiPacks, meetings, passwordResetTokens, processingJobs, sessions, transcriptSegments } from '../db/schema';
import { hashToken } from '../lib/crypto';
import { ConsoleEmailProvider } from '../email/console';
import { createUser, createWorkspace, login, makeTestApp, testEnv, truncateAll, type TestApp } from './helpers';

/** A full AppContext with all-mock providers for building custom test apps. */
function testCtx(env: ReturnType<typeof testEnv>, db: TestApp['db']): AppContext {
  return { env, db, transcription: new MockTranscriptionAdapter(), email: new ConsoleEmailProvider(), enqueue: async () => {} };
}

let h: TestApp;
const emailBox = () => h.app.ctx.email as ConsoleEmailProvider;

beforeAll(async () => {
  h = await makeTestApp();
});
afterAll(async () => {
  await h.close();
});
beforeEach(async () => {
  await truncateAll(h.db);
  emailBox().sent.length = 0;
});

describe('email lifecycle', () => {
  it('approving an access request sends a locale-aware invitation email', async () => {
    const ws = await createWorkspace(h.db);
    await createUser(h.db, { email: 'admin@acme.com', workspaceId: ws, role: 'owner' });
    const cookie = await login(h.app, 'admin@acme.com');

    const submit = await h.app.inject({ method: 'POST', url: '/api/access/request', payload: { name: 'Nova Pessoa', email: 'nova@empresa.com', company: 'Empresa', role: 'PM', useCase: 'Quero transformar reuniões em contexto.', preferredLocale: 'pt-BR' } });
    const reqId = submit.json().id;
    const approve = await h.app.inject({ method: 'POST', url: `/api/admin/access-requests/${reqId}/approve`, headers: { cookie } });
    expect(approve.statusCode).toBe(200);

    const sent = emailBox().sent;
    expect(sent.some((e) => e.kind === 'invitation' && e.to === 'nova@empresa.com' && e.locale === 'pt-BR')).toBe(true);
  });

  it('rejection and request-info send their emails', async () => {
    const ws = await createWorkspace(h.db);
    await createUser(h.db, { email: 'admin2@acme.com', workspaceId: ws, role: 'owner' });
    const cookie = await login(h.app, 'admin2@acme.com');
    const submit = await h.app.inject({ method: 'POST', url: '/api/access/request', payload: { name: 'Other Person', email: 'x@empresa.com', company: 'Empresa', role: 'PM', useCase: 'Motivo suficientemente longo aqui.', preferredLocale: 'en-US' } });
    const reqId = submit.json().id;

    await h.app.inject({ method: 'POST', url: `/api/admin/access-requests/${reqId}/request-info`, headers: { cookie }, payload: { message: 'Need company size' } });
    await h.app.inject({ method: 'POST', url: `/api/admin/access-requests/${reqId}/reject`, headers: { cookie }, payload: { reason: 'Not a fit right now' } });
    const kinds = emailBox().sent.map((e) => e.kind);
    expect(kinds).toContain('more_information');
    expect(kinds).toContain('rejection');
    expect(emailBox().sent.every((e) => e.locale === 'en-US')).toBe(true);
  });
});

describe('password reset', () => {
  it('forgot → token + email; unknown email is generic and sends nothing', async () => {
    const ws = await createWorkspace(h.db);
    const uid = await createUser(h.db, { email: 'user@acme.com', workspaceId: ws });

    const known = await h.app.inject({ method: 'POST', url: '/api/auth/forgot-password', payload: { email: 'user@acme.com' } });
    expect(known.json()).toEqual({ sent: true });
    const tokens = await h.db.select().from(passwordResetTokens).where(eq(passwordResetTokens.userId, uid));
    expect(tokens).toHaveLength(1);
    expect(emailBox().sent.some((e) => e.kind === 'password_reset')).toBe(true);

    emailBox().sent.length = 0;
    const unknown = await h.app.inject({ method: 'POST', url: '/api/auth/forgot-password', payload: { email: 'nobody@acme.com' } });
    expect(unknown.json()).toEqual({ sent: true }); // no enumeration
    expect(emailBox().sent).toHaveLength(0);
  });

  it('reset with a valid token changes the password, revokes sessions, and is single-use', async () => {
    const ws = await createWorkspace(h.db);
    const uid = await createUser(h.db, { email: 'reset@acme.com', workspaceId: ws, password: 'oldpassword1' });
    const oldCookie = await login(h.app, 'reset@acme.com', 'oldpassword1');

    // Seed a known reset token.
    const token = 'known-reset-token-123';
    await h.db.insert(passwordResetTokens).values({ userId: uid, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3_600_000) });

    const res = await h.app.inject({ method: 'POST', url: '/api/auth/reset-password', payload: { token, password: 'newpassword1', confirmPassword: 'newpassword1' } });
    expect(res.statusCode).toBe(200);

    // Old session revoked.
    const sess = await h.app.inject({ method: 'GET', url: '/api/auth/session', headers: { cookie: oldCookie } });
    expect(sess.json().session).toBeNull();
    // New password works, old one doesn't.
    expect((await h.app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'reset@acme.com', password: 'newpassword1' } })).statusCode).toBe(200);
    expect((await h.app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'reset@acme.com', password: 'oldpassword1' } })).statusCode).toBe(401);
    // Token is single-use.
    const reuse = await h.app.inject({ method: 'POST', url: '/api/auth/reset-password', payload: { token, password: 'another1234', confirmPassword: 'another1234' } });
    expect(reuse.statusCode).toBe(400);
    // The session that existed before the reset is revoked (the fresh login above made a new one).
    const preReset = await h.db.select().from(sessions).where(and(eq(sessions.userId, uid), eq(sessions.tokenHash, hashToken(oldCookie.split('=')[1]!))));
    expect(preReset.every((s) => s.revokedAt != null)).toBe(true);
  });

  it('an invalid reset token is rejected', async () => {
    const res = await h.app.inject({ method: 'POST', url: '/api/auth/reset-password', payload: { token: 'nope', password: 'whatever1', confirmPassword: 'whatever1' } });
    expect(res.statusCode).toBe(400);
  });
});

describe('delete meeting', () => {
  it('removes the meeting and all server-side rows (no remote audio to delete)', async () => {
    const ws = await createWorkspace(h.db);
    const uid = await createUser(h.db, { email: 'del@acme.com', workspaceId: ws, role: 'owner' });
    const cookie = await login(h.app, 'del@acme.com');

    const [m] = await h.db.insert(meetings).values({ workspaceId: ws, ownerId: uid, title: 'To delete', source: 'recording', status: 'ready', meetingLanguage: 'pt-BR', durationSeconds: 1, participantCount: 1 }).returning();
    await h.db.insert(transcriptSegments).values({ workspaceId: ws, meetingId: m!.id, speakerKey: 'sp1', orderIndex: 0, sequence: 0, startSeconds: 0, endSeconds: 1, text: 'oi', language: 'pt-BR' });
    await h.db.insert(aiPacks).values({ workspaceId: ws, meetingId: m!.id, version: 1, isCurrent: true, sourceSections: [] });

    const del = await h.app.inject({ method: 'DELETE', url: `/api/meetings/${m!.id}`, headers: { cookie } });
    expect(del.statusCode).toBe(200);
    expect((await h.db.select().from(meetings).where(eq(meetings.id, m!.id)))).toHaveLength(0);
    expect((await h.db.select().from(transcriptSegments).where(eq(transcriptSegments.meetingId, m!.id)))).toHaveLength(0);
    expect((await h.db.select().from(aiPacks).where(eq(aiPacks.meetingId, m!.id)))).toHaveLength(0);
  });
});

describe('quotas', () => {
  it('rejects a new process-audio once the workspace active-job limit is reached', async () => {
    const env = testEnv({ MAX_ACTIVE_PROCESSING_JOBS_PER_WORKSPACE: '1' });
    const app = await buildApp(testCtx(env, h.db));
    await app.ready();
    const ws = await createWorkspace(h.db);
    const uid = await createUser(h.db, { email: 'q@acme.com', workspaceId: ws, role: 'owner' });
    const cookie = await login(app, 'q@acme.com');

    const send = () => app.inject({ method: 'POST', url: '/api/meetings/process-audio?title=A&meetingLanguage=pt-BR', headers: { cookie, 'content-type': 'audio/webm' }, payload: Buffer.from([1, 2, 3, 4]) });

    // With no jobs in flight, an ingest is accepted (202, processed detached).
    expect((await send()).statusCode).toBe(202);

    // Seed a queued processing job so the workspace is at its (=1) limit.
    const [m] = await h.db.insert(meetings).values({ workspaceId: ws, ownerId: uid, title: 'Busy', source: 'recording', status: 'processing', meetingLanguage: 'pt-BR', durationSeconds: 1, participantCount: 0 }).returning();
    await h.db.insert(processingJobs).values({ workspaceId: ws, meetingId: m!.id, type: 'transcription', status: 'queued', stage: 'received', progress: 0 });

    const blocked = await send();
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json().error.code).toBe('quota_exceeded');
    await app.close();
  });
});
