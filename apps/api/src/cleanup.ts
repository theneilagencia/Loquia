import { createStorageProvider } from '@loquia/pipeline';
import { createDb } from './db/client';
import { loadEnv } from './env';
import { runMediaCleanup } from './services/retention';

/**
 * Media retention cleanup entrypoint (Milestone 5 §35). Designed to run
 * periodically (Render cron job / scheduled task). Deletes expired media from
 * object storage and marks the assets deleted; the transcript and AI Pack are
 * never touched. Structured, ID-only logging (never media content or URLs).
 */
function log(event: string, fields: Record<string, unknown> = {}): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ts: new Date().toISOString(), service: 'loquia-cleanup', event, ...fields }));
}

async function main(): Promise<void> {
  const env = loadEnv();
  const { db, close } = createDb(env.DATABASE_URL, { max: 3 });
  const storage = createStorageProvider(env, {
    dir: env.MEDIA_MOCK_DIR,
    baseUrl: env.PUBLIC_API_URL ?? `http://localhost:${env.API_PORT}`,
  });
  log('cleanup_started', { storage: storage.name });
  try {
    const result = await runMediaCleanup({ db, storage, log });
    log('cleanup_completed', { ...result });
    if (result.failed > 0) process.exitCode = 1; // surface partial failures
  } finally {
    await close();
  }
}

main().catch((err) => {
  log('cleanup_crashed', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
