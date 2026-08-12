import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createUser, createWorkspace, login, makeTestApp, truncateAll, type TestApp } from './helpers';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

let t: TestApp;
beforeAll(async () => {
  t = await makeTestApp();
});
afterAll(async () => {
  await t.close();
});
beforeEach(async () => {
  await truncateAll(t.db);
});

describe('auth — login generic error (no enumeration)', () => {
  it('returns an identical 401 for unknown email, wrong password, pending and suspended', async () => {
    const ws = await createWorkspace(t.db);
    await createUser(t.db, { email: 'active@acme.com', workspaceId: ws, role: 'owner' });
    await createUser(t.db, { email: 'pending@acme.com', workspaceId: ws, status: 'pending_activation' });
    await createUser(t.db, { email: 'suspended@acme.com', workspaceId: ws, status: 'suspended' });

    const cases = [
      { email: 'nobody@acme.com', password: 'password123' },
      { email: 'active@acme.com', password: 'wrong-password' },
      { email: 'pending@acme.com', password: 'password123' },
      { email: 'suspended@acme.com', password: 'password123' },
    ];
    const bodies = new Set<string>();
    for (const payload of cases) {
      const res = await t.app.inject({ method: 'POST', url: '/api/auth/login', payload });
      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('unauthorized');
      bodies.add(body.error.message);
    }
    // Every failure returns the same generic message.
    expect(bodies.size).toBe(1);
  });

  it('logs in an active user, restores the session and logs out', async () => {
    const ws = await createWorkspace(t.db);
    await createUser(t.db, { email: 'owner@acme.com', workspaceId: ws, role: 'owner' });

    const cookie = await login(t.app, 'owner@acme.com');
    const session = await t.app.inject({ method: 'GET', url: '/api/auth/session', headers: { cookie } });
    expect(session.statusCode).toBe(200);
    expect(JSON.parse(session.body).session.user.email).toBe('owner@acme.com');

    const logout = await t.app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie } });
    expect(logout.statusCode).toBe(200);

    // Cookie is now revoked server-side.
    const after = await t.app.inject({ method: 'GET', url: '/api/auth/session', headers: { cookie } });
    expect(JSON.parse(after.body).session).toBeNull();
  });

  it('a suspended user with a valid cookie is rejected', async () => {
    const ws = await createWorkspace(t.db);
    const uid = await createUser(t.db, { email: 'x@acme.com', workspaceId: ws, role: 'owner' });
    const cookie = await login(t.app, 'x@acme.com');
    await t.db.update(users).set({ status: 'suspended' }).where(eq(users.id, uid));
    const res = await t.app.inject({ method: 'GET', url: '/api/auth/session', headers: { cookie } });
    expect(JSON.parse(res.body).session).toBeNull();
  });
});
