import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createUser, createWorkspace, login, makeTestApp, truncateAll, type TestApp } from './helpers';
import { meetings } from '../db/schema';

let t: TestApp;
beforeAll(async () => { t = await makeTestApp(); });
afterAll(async () => { await t.close(); });
beforeEach(async () => { await truncateAll(t.db); });

describe('workspace isolation', () => {
  it('a user cannot read a meeting from another workspace', async () => {
    const wsA = await createWorkspace(t.db, 'A');
    const wsB = await createWorkspace(t.db, 'B');
    const userAId = await createUser(t.db, { email: 'a@a.com', workspaceId: wsA, role: 'owner' });
    await createUser(t.db, { email: 'b@b.com', workspaceId: wsB, role: 'owner' });

    const [meetingB] = await t.db
      .insert(meetings)
      .values({ workspaceId: wsB, ownerId: userAId /* irrelevant */, title: 'B secret', source: 'upload', status: 'ready', meetingLanguage: 'pt-BR', durationSeconds: 10, participantCount: 1 })
      .returning();

    const cookieA = await login(t.app, 'a@a.com');
    const res = await t.app.inject({ method: 'GET', url: `/api/meetings/${meetingB!.id}`, headers: { cookie: cookieA } });
    // Cross-workspace access is indistinguishable from not-found.
    expect(res.statusCode).toBe(404);

    const cookieB = await login(t.app, 'b@b.com');
    const okB = await t.app.inject({ method: 'GET', url: `/api/meetings/${meetingB!.id}`, headers: { cookie: cookieB } });
    expect(okB.statusCode).toBe(200);
  });
});

describe('admin authorization (roles)', () => {
  it('a member is forbidden from admin endpoints; an admin is allowed', async () => {
    const ws = await createWorkspace(t.db, 'Org');
    await createUser(t.db, { email: 'member@org.com', workspaceId: ws, role: 'member' });
    await createUser(t.db, { email: 'admin@org.com', workspaceId: ws, role: 'admin' });

    const memberCookie = await login(t.app, 'member@org.com');
    const forbidden = await t.app.inject({ method: 'GET', url: '/api/admin/users', headers: { cookie: memberCookie } });
    expect(forbidden.statusCode).toBe(403);

    const adminCookie = await login(t.app, 'admin@org.com');
    const allowed = await t.app.inject({ method: 'GET', url: '/api/admin/users', headers: { cookie: adminCookie } });
    expect(allowed.statusCode).toBe(200);
  });

  it('unauthenticated requests to protected endpoints get 401', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/api/meetings' });
    expect(res.statusCode).toBe(401);
  });
});
