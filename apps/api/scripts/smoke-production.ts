/**
 * Production smoke suite (Milestone 5 §58). Safe, non-destructive checks against
 * the configured infrastructure — plus honest live-provider checks that report
 * `NOT RUN — credentials unavailable` when a secret is missing (never a false
 * PASS). Run: `pnpm --filter @loquia/api smoke:production`.
 *
 * Non-destructive: the only writes are a throwaway queue job and (for the mock
 * storage) a temp object, both removed by the smoke itself.
 */
import { Queue } from 'bullmq';
import { sql } from 'drizzle-orm';
import { createRedis, MEETING_QUEUE } from '@loquia/pipeline';
import { createDb } from '../src/db/client';
import { loadEnv } from '../src/env';
import { createEmailProvider } from '../src/email/factory';

type Status = 'PASS' | 'FAIL' | 'NOT RUN' | 'CONFIG';
const results: { name: string; status: Status; detail?: string }[] = [];
const rec = (name: string, status: Status, detail?: string) => results.push({ name, status, detail });

async function main(): Promise<void> {
  const env = loadEnv();

  // Config presence (no secret values printed). M5.2: no object storage.
  rec('config: transcription provider', 'CONFIG', env.TRANSCRIPTION_PROVIDER ?? (env.DEEPGRAM_API_KEY ? 'deepgram (implicit)' : 'mock'));
  rec('config: STT callback secret', env.DEEPGRAM_CALLBACK_SECRET ? 'CONFIG' : 'NOT RUN', env.DEEPGRAM_CALLBACK_SECRET ? 'set' : 'unset (required in prod with deepgram)');
  rec('config: AI Pack provider', 'CONFIG', env.AI_PACK_PROVIDER ?? (env.ANTHROPIC_API_KEY ? 'anthropic (implicit)' : 'mock'));
  rec('config: email provider', 'CONFIG', env.EMAIL_PROVIDER ?? (env.EMAIL_API_KEY ? 'resend (implicit)' : 'console'));

  // Database.
  const { db, close } = createDb(env.DATABASE_URL, { max: 2 });
  try {
    await db.execute(sql`select 1`);
    rec('database connectivity', 'PASS');
  } catch (err) {
    rec('database connectivity', 'FAIL', (err as Error).message);
  }

  // Redis / queue: enqueue a throwaway job, read it back, remove it.
  if (env.REDIS_URL) {
    const conn = createRedis(env.REDIS_URL);
    try {
      const queue = new Queue(MEETING_QUEUE, { connection: conn });
      const jobId = `smoke-${Date.now()}`;
      const job = await queue.add('smoke', { processingJobId: jobId }, { jobId, removeOnComplete: true });
      const fetched = await queue.getJob(job.id!);
      await job.remove();
      await queue.close();
      rec('queue enqueue round-trip', fetched ? 'PASS' : 'FAIL');
    } catch (err) {
      rec('queue enqueue round-trip', 'FAIL', (err as Error).message);
    } finally {
      conn.disconnect();
    }
  } else {
    rec('queue enqueue round-trip', 'NOT RUN', 'REDIS_URL unavailable');
  }

  // M5.2: object storage was removed. Verify the temp-media dir is writable — the
  // API streams the audio there during ingest and deletes it after transcription.
  try {
    const { streamToTempFile, removeTempFile } = await import('../src/services/temp-media');
    const { Readable } = await import('node:stream');
    const { path } = await streamToTempFile(Readable.from([Buffer.from('loquia-smoke')]), `smoke-${Date.now()}`, 1024);
    await removeTempFile(path);
    rec('temp media write/delete', 'PASS', 'stream → temp file → delete');
  } catch (err) {
    rec('temp media write/delete', 'FAIL', (err as Error).message);
  }

  // Email: only a live send when a real provider + authorized recipient exist.
  const smokeTo = process.env.SMOKE_EMAIL_TO;
  if (env.EMAIL_PROVIDER === 'resend' && env.EMAIL_API_KEY && smokeTo) {
    try {
      const email = createEmailProvider(env);
      const res = await email.sendPasswordReset({ to: smokeTo, name: 'Smoke', resetUrl: `${env.APP_URL}/pt-BR/reset-password/smoke`, expiresAt: 'soon', locale: 'pt-BR' });
      rec('email live send', res.ok ? 'PASS' : 'FAIL', res.ok ? `providerId=${res.id}` : res.error);
    } catch (err) {
      rec('email live send', 'FAIL', (err as Error).message);
    }
  } else {
    rec('email live send', 'NOT RUN', 'credentials/recipient unavailable');
  }

  // Live provider capability checks are covered by `pnpm --filter @loquia/pipeline smoke`.
  rec('deepgram live smoke', env.DEEPGRAM_API_KEY ? 'CONFIG' : 'NOT RUN', env.DEEPGRAM_API_KEY ? 'run: pnpm --filter @loquia/pipeline smoke' : 'credentials unavailable');
  rec('anthropic live smoke', env.ANTHROPIC_API_KEY ? 'CONFIG' : 'NOT RUN', env.ANTHROPIC_API_KEY ? 'run: pnpm --filter @loquia/pipeline smoke' : 'credentials unavailable');

  await close();

  // eslint-disable-next-line no-console
  console.log('\nProduction smoke suite (Milestone 5)\n');
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(`  ${r.status.padEnd(8)} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  const failed = results.filter((r) => r.status === 'FAIL');
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('smoke:production crashed', err);
  process.exit(1);
});
