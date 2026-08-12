import { sql } from 'drizzle-orm';
import { createDb, runMigrations, schema, type Database } from '@loquia/api/db';
import { MockStorageAdapter } from '@loquia/pipeline';

const { workspaces, users, meetings, mediaAssets, processingJobs } = schema;

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

export function makeMockStorage(): MockStorageAdapter {
  return new MockStorageAdapter('/tmp/loquia-worker-test', 'http://localhost:4000');
}

export interface Fixture {
  workspaceId: string;
  meetingId: string;
  mediaAssetId: string;
  jobId: string;
}

/** Seed a workspace/user/meeting/uploaded-media/queued-job ready for processing. */
export async function seedProcessable(
  db: Database,
  storage: MockStorageAdapter,
  opts?: { meetingLanguage?: string },
): Promise<Fixture> {
  const [ws] = await db.insert(workspaces).values({ name: 'Org', slug: 'org', plan: 'pro', seats: 5 }).returning();
  const [user] = await db.insert(users).values({ email: 'o@org.com', name: 'O', role: 'owner', status: 'active', workspaceId: ws!.id }).returning();
  const [meeting] = await db
    .insert(meetings)
    .values({ workspaceId: ws!.id, ownerId: user!.id, title: 'Uploaded meeting', source: 'upload', status: 'processing', meetingLanguage: opts?.meetingLanguage ?? 'pt-BR', durationSeconds: 0, participantCount: 0 })
    .returning();
  const objectKey = `workspace/${ws!.id}/meetings/${meeting!.id}/asset/audio.webm`;
  storage.putObjectSync(objectKey, new Uint8Array([1, 2, 3, 4]), 'audio/webm');
  const [asset] = await db
    .insert(mediaAssets)
    .values({ workspaceId: ws!.id, meetingId: meeting!.id, storageProvider: 'mock', bucket: 'mock', objectKey, originalFilename: 'audio.webm', mimeType: 'audio/webm', sizeBytes: 4, status: 'uploaded', uploadedAt: new Date() })
    .returning();
  const [job] = await db
    .insert(processingJobs)
    .values({ workspaceId: ws!.id, meetingId: meeting!.id, mediaAssetId: asset!.id, type: 'media_processing', status: 'queued', stage: 'received', progress: 0 })
    .returning();
  return { workspaceId: ws!.id, meetingId: meeting!.id, mediaAssetId: asset!.id, jobId: job!.id };
}

export const noopLog = () => {};
