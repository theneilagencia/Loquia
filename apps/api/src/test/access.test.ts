import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createUser, createWorkspace, login, makeTestApp, truncateAll, type TestApp } from './helpers';
import { accessRequests, auditEvents, invitations, users } from '../db/schema';

let t: TestApp;
beforeAll(async () => { t = await makeTestApp(); });
afterAll(async () => { await t.close(); });
beforeEach(async () => { await truncateAll(t.db); });

async function adminCookie() {
  const ws = await createWorkspace(t.db, 'Platform');
  await createUser(t.db, { email: 'admin@platform.com', workspaceId: ws, role: 'admin' });
  return login(t.app, 'admin@platform.com');
}

const requestBody = {
  name: 'Rafael Souza',
  email: 'rafael@acme.com',
  company: 'Acme',
  role: 'CTO',
  useCase: 'Feed engineering syncs into internal AI tools.',
  preferredLocale: 'pt-BR',
};

describe('access lifecycle', () => {
  it('public request creates an AccessRequest and no User', async () => {
    const res = await t.app.inject({ method: 'POST', url: '/api/access/request', payload: requestBody });
    expect(res.statusCode).toBe(200);
    const reqs = await t.db.select().from(accessRequests);
    expect(reqs).toHaveLength(1);
    expect(reqs[0]!.status).toBe('submitted');
    const usr = await t.db.select().from(users).where(eq(users.email, 'rafael@acme.com'));
    expect(usr).toHaveLength(0); // never auto-creates a user
  });

  it('approve is transactional: workspace + pending user + invitation + audit', async () => {
    const cookie = await adminCookie();
    await t.app.inject({ method: 'POST', url: '/api/access/request', payload: requestBody });
    const reqId = (await t.db.select().from(accessRequests).where(eq(accessRequests.email, 'rafael@acme.com')))[0]!.id;

    const approve = await t.app.inject({ method: 'POST', url: `/api/admin/access-requests/${reqId}/approve`, headers: { cookie } });
    expect(approve.statusCode).toBe(200);
    const invitation = JSON.parse(approve.body);
    expect(invitation.token).toBeTruthy(); // plaintext echoed once

    const pendingUser = (await t.db.select().from(users).where(eq(users.email, 'rafael@acme.com')))[0];
    expect(pendingUser?.status).toBe('pending_activation');
    const audits = (await t.db.select().from(auditEvents)).map((a) => a.action);
    expect(audits).toContain('approved');
    expect(audits).toContain('invitation_created');
  });

  it('activation activates the user, accepts the invitation and is single-use', async () => {
    const cookie = await adminCookie();
    await t.app.inject({ method: 'POST', url: '/api/access/request', payload: requestBody });
    const reqId = (await t.db.select().from(accessRequests).where(eq(accessRequests.email, 'rafael@acme.com')))[0]!.id;
    const approve = await t.app.inject({ method: 'POST', url: `/api/admin/access-requests/${reqId}/approve`, headers: { cookie } });
    const token = JSON.parse(approve.body).token as string;

    const activate = await t.app.inject({
      method: 'POST',
      url: '/api/access/activate',
      payload: { token, name: 'Rafael Souza', password: 'password123', confirmPassword: 'password123' },
    });
    expect(activate.statusCode).toBe(200);
    expect(activate.headers['set-cookie']).toBeTruthy();
    const user = (await t.db.select().from(users).where(eq(users.email, 'rafael@acme.com')))[0]!;
    expect(user.status).toBe('active');
    const inv = (await t.db.select().from(invitations).where(eq(invitations.email, 'rafael@acme.com')))[0]!;
    expect(inv.status).toBe('accepted');

    // Second use of the same token is rejected.
    const second = await t.app.inject({
      method: 'POST',
      url: '/api/access/activate',
      payload: { token, name: 'Rafael', password: 'password123', confirmPassword: 'password123' },
    });
    expect(second.statusCode).toBe(409);
  });

  it('a revoked invitation cannot be activated', async () => {
    const cookie = await adminCookie();
    const invite = await t.app.inject({ method: 'POST', url: '/api/admin/invitations', headers: { cookie }, payload: { email: 'new@acme.com', role: 'member' } });
    const { id, token } = JSON.parse(invite.body);
    await t.app.inject({ method: 'POST', url: `/api/admin/invitations/${id}/revoke`, headers: { cookie } });
    const activate = await t.app.inject({ method: 'POST', url: '/api/access/activate', payload: { token, name: 'New', password: 'password123', confirmPassword: 'password123' } });
    expect(activate.statusCode).toBe(409);
  });

  it('resend invalidates the previous token', async () => {
    const cookie = await adminCookie();
    const invite = await t.app.inject({ method: 'POST', url: '/api/admin/invitations', headers: { cookie }, payload: { email: 'r@acme.com', role: 'member' } });
    const { id, token: oldToken } = JSON.parse(invite.body);
    const resend = await t.app.inject({ method: 'POST', url: `/api/admin/invitations/${id}/resend`, headers: { cookie } });
    const { token: newToken } = JSON.parse(resend.body);
    expect(newToken).not.toBe(oldToken);

    const withOld = await t.app.inject({ method: 'POST', url: '/api/access/activate', payload: { token: oldToken, name: 'Rafael', password: 'password123', confirmPassword: 'password123' } });
    expect(withOld.statusCode).toBe(400); // old token no longer resolves
  });

  it('an expired invitation cannot be activated', async () => {
    const cookie = await adminCookie();
    const invite = await t.app.inject({ method: 'POST', url: '/api/admin/invitations', headers: { cookie }, payload: { email: 'exp@acme.com', role: 'member' } });
    const { id, token } = JSON.parse(invite.body);
    await t.db.update(invitations).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(invitations.id, id));
    const activate = await t.app.inject({ method: 'POST', url: '/api/access/activate', payload: { token, name: 'Edu', password: 'password123', confirmPassword: 'password123' } });
    expect(activate.statusCode).toBe(409);
  });
});
