import { Queue, Worker } from 'bullmq';
import { createDb } from '@loquia/api/db';
import { loadEnv } from '@loquia/api/env';
import {
  createAIPackGenerator,
  createRedis,
  createStorageProvider,
  createTranscriptionProvider,
  MEETING_QUEUE,
  type MeetingJobData,
} from '@loquia/pipeline';
import { processJob } from './process-job';

/** Structured log line — IDs only, never meeting content (task §34, §38). */
function log(event: string, fields: Record<string, unknown> = {}): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ts: new Date().toISOString(), service: 'loquia-worker', event, ...fields }));
}

async function main(): Promise<void> {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error('REDIS_URL is required to run the worker');

  const { db } = createDb(env.DATABASE_URL);
  const storage = createStorageProvider(env, {
    dir: env.MEDIA_MOCK_DIR,
    baseUrl: env.PUBLIC_API_URL ?? `http://localhost:${env.API_PORT}`,
  });
  const transcription = createTranscriptionProvider(env);
  const generator = createAIPackGenerator(env);
  log('worker_config', { storage: storage.name, transcription: transcription.name, aiPack: generator.name, aiPackModel: generator.model });

  // Producer so a transcription job can chain the follow-up ai_pack job.
  const producer = new Queue<MeetingJobData>(MEETING_QUEUE, { connection: createRedis(env.REDIS_URL) });
  const enqueue = async (processingJobId: string): Promise<void> => {
    await producer.add(
      'process',
      { processingJobId },
      { jobId: processingJobId, attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100, removeOnFail: 500 },
    );
  };

  const worker = new Worker<MeetingJobData>(
    MEETING_QUEUE,
    async (job) => {
      await processJob(
        { db, storage, transcription, generator, log, enqueue, downloadTtlSeconds: env.MEDIA_DOWNLOAD_URL_TTL_SECONDS },
        job.data.processingJobId,
      );
    },
    { connection: createRedis(env.REDIS_URL), concurrency: 4 },
  );

  worker.on('failed', (job, err) => log('bullmq_job_failed', { jobId: job?.id, error: err.message }));
  worker.on('ready', () => log('worker_ready', { queue: MEETING_QUEUE }));

  // Graceful shutdown: stop consuming, let the in-flight job finish, close conns.
  let closing = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (closing) return;
    closing = true;
    log('shutdown_started', { signal });
    try {
      await worker.close(); // waits for the active job to complete
      await producer.close();
      log('shutdown_complete', {});
      process.exit(0);
    } catch (err) {
      log('shutdown_failed', { error: err instanceof Error ? err.message : String(err) });
      process.exit(1);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('worker failed to start', err);
  process.exit(1);
});
