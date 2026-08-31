import { sql } from 'drizzle-orm';
import { createDb, runMigrations, schema, type Database } from '@loquia/api/db';
import { MockAIPackGenerator } from '@loquia/pipeline';
import type { JobDeps } from '@loquia/api/jobs';

const { workspaces, users, meetings, transcriptSegments, processingJobs } = schema;

export const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres@127.0.0.1:5433/loquia_test';

let migrated = false;

export async function makeWorkerTestDb(): Promise<{ db: Database; close: () => Promise<void> }> {
  if (!migrated) {
    await runMigrations(TEST_DB_URL);
    migrated = true;
  }
  const handle = createDb(TEST_DB_URL, { max: 3 });
  return { db: handle.db, close: handle.close };
}

export async function truncateAll(db: Database): Promise<void> {
  await db.execute(sql`
    TRUNCATE audit_events, transcript_segments, ai_packs, processing_jobs, export_history,
      export_presets, markers, participants, media_assets, meetings, invitations,
      access_requests, user_settings, sessions, users, workspaces RESTART IDENTITY CASCADE
  `);
}

/** Build JobDeps (AI-Pack-only) with a mock generator for tests. */
export function makeWorkerDeps(db: Database, extra?: Partial<JobDeps>): JobDeps {
  return {
    db,
    generator: new MockAIPackGenerator(),
    log: noopLog,
    ...extra,
  };
}

export interface Fixture {
  workspaceId: string;
  meetingId: string;
  /** A queued ai_pack job ready for the worker. */
  aiPackJobId: string;
}

/**
 * Seed a workspace/user/meeting with a persisted transcript and a queued ai_pack
 * job — the exact state the API ingest leaves behind for the worker (M5.2).
 */
export async function seedAiPackReady(db: Database, opts?: { meetingLanguage?: string }): Promise<Fixture> {
  const [ws] = await db.insert(workspaces).values({ name: 'Org', slug: 'org', plan: 'pro', seats: 5 }).returning();
  const [user] = await db.insert(users).values({ email: 'o@org.com', name: 'O', role: 'owner', status: 'active', workspaceId: ws!.id }).returning();
  const lang = opts?.meetingLanguage ?? 'pt-BR';
  const [meeting] = await db
    .insert(meetings)
    .values({ workspaceId: ws!.id, ownerId: user!.id, title: 'Recorded meeting', source: 'recording', status: 'ready', meetingLanguage: lang, detectedLanguage: lang, durationSeconds: 12, participantCount: 2, aiPackStatus: 'queued' })
    .returning();
  await db.insert(transcriptSegments).values([
    { workspaceId: ws!.id, meetingId: meeting!.id, speakerKey: 'sp1', orderIndex: 0, sequence: 0, startSeconds: 0, endSeconds: 4, startMs: 0, endMs: 4000, text: 'A decisão é lançar o piloto.', language: lang },
    { workspaceId: ws!.id, meetingId: meeting!.id, speakerKey: 'sp2', orderIndex: 1, sequence: 1, startSeconds: 4, endSeconds: 8, startMs: 4000, endMs: 8000, text: 'Concordo, vamos seguir.', language: lang },
  ]);
  const [job] = await db
    .insert(processingJobs)
    .values({ workspaceId: ws!.id, meetingId: meeting!.id, type: 'ai_pack', status: 'queued', stage: 'ready_for_ai_pack', progress: 0 })
    .returning();
  return { workspaceId: ws!.id, meetingId: meeting!.id, aiPackJobId: job!.id };
}

export const noopLog = () => {};
