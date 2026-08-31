import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootstrapAdmin } from '../db/bootstrap-admin';
import { users } from '../db/schema';
import { login, makeTestApp, TEST_DB_URL, truncateAll, type TestApp } from './helpers';

describe('bootstrap-admin', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await makeTestApp();
  });

  afterAll(async () => {
    await t.close();
  });

  it('creates the first owner, is idempotent, and that admin can sign in and reach admin routes', async () => {
    await truncateAll(t.db);

    // First run on an empty DB creates the owner.
    const first = await bootstrapAdmin(TEST_DB_URL, {
      email: 'root@loquia.test',
      password: 's3cr3t-pass',
      name: 'Root',
      locale: 'pt-BR',
    });
    expect(first).toBe('created');

    // Second run on a populated DB is a no-op — it must never wipe or duplicate.
    const second = await bootstrapAdmin(TEST_DB_URL, {
      email: 'someone-else@loquia.test',
      password: 'ignored',
      name: 'Ignored',
      locale: 'en-US',
    });
    expect(second).toBe('skipped');

    // Exactly one user, and it is the owner we asked for.
    const all = await t.db.select().from(users);
    expect(all).toHaveLength(1);
    expect(all[0]!.email).toBe('root@loquia.test');
    expect(all[0]!.role).toBe('owner');
    expect(all[0]!.status).toBe('active');

    // The bootstrapped admin can authenticate and reach an admin-only route.
    const cookie = await login(t.app, 'root@loquia.test', 's3cr3t-pass');
    const res = await t.app.inject({
      method: 'GET',
      url: '/api/admin/overview',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
  });
});
