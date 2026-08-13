import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { createDb, type Database } from '../db/client';
import { runMigrations } from '../db/migrate';
import { loadEnv } from '../env';
import { users, userSettings, workspaces } from '../db/schema';
import { hashPassword } from '../lib/crypto';
import { defaultSettings } from '../services/defaults';

export const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres@127.0.0.1:5433/loquia_test';

let migrated = false;

export interface TestApp {
  app: FastifyInstance;
  db: Database;
  close: () => Promise<void>;
}

/** Full env for tests. Pass `extra` to override individual keys without losing the base config. */
export function testEnv(extra?: Partial<NodeJS.ProcessEnv>): ReturnType<typeof loadEnv> {
  return loadEnv({
    DATABASE_URL: TEST_DB_URL,
    NODE_ENV: 'test',
    SESSION_SECRET: 'test-secret-0123456789-abcdef',
    TRANSCRIPTION_PROVIDER: 'mock',
    PUBLIC_API_URL: 'http://localhost:4000',
    REDIS_URL: process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:6380',
    ...extra,
  });
}

export async function makeTestApp(): Promise<TestApp> {
  if (!migrated) {
    await runMigrations(TEST_DB_URL);
    migrated = true;
  }
  const env = testEnv();
  const { db, close } = createDb(TEST_DB_URL, { max: 3 });
  const app = await buildApp({ env, db });
  await app.ready();
  return {
    app,
    db,
    close: async () => {
      await app.close();
      await close();
    },
  };
}

export async function truncateAll(db: Database): Promise<void> {
  await db.execute(sql`
    TRUNCATE audit_events, transcript_segments, ai_packs, processing_jobs, export_history,
      export_presets, markers, participants, meetings, invitations, access_requests,
      user_settings, sessions, users, workspaces RESTART IDENTITY CASCADE
  `);
}

export async function createWorkspace(db: Database, name = 'Acme'): Promise<string> {
  const rows = await db.insert(workspaces).values({ name, slug: name.toLowerCase(), plan: 'pro', seats: 10 }).returning();
  return rows[0]!.id;
}

export async function createUser(
  db: Database,
  opts: { email: string; workspaceId: string; role?: 'owner' | 'admin' | 'member'; password?: string; status?: string },
): Promise<string> {
  const passwordHash = await hashPassword(opts.password ?? 'password123');
  const rows = await db
    .insert(users)
    .values({
      email: opts.email.toLowerCase(),
      name: opts.email.split('@')[0]!,
      role: opts.role ?? 'member',
      status: (opts.status as 'active') ?? 'active',
      workspaceId: opts.workspaceId,
      passwordHash,
      activatedAt: new Date(),
    })
    .returning();
  const userId = rows[0]!.id;
  const s = defaultSettings(userId);
  await db.insert(userSettings).values({ userId, general: s.general, recording: s.recording, export: s.export, language: s.language, privacy: s.privacy, appearance: s.appearance });
  return userId;
}

/** Log in and return the session cookie string for subsequent inject() calls. */
export async function login(
  app: FastifyInstance,
  email: string,
  password = 'password123',
): Promise<string> {
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, password } });
  if (res.statusCode !== 200) throw new Error(`login failed: ${res.statusCode} ${res.body}`);
  const setCookie = res.headers['set-cookie'];
  const raw = Array.isArray(setCookie) ? setCookie[0]! : (setCookie as string);
  return raw.split(';')[0]!; // "loquia_session=..."
}
