import { buildApp } from './app';
import { createDb } from './db/client';
import { loadEnv } from './env';

async function main(): Promise<void> {
  const env = loadEnv();
  // API-owned connection pool (never opened per request).
  const { db, close } = createDb(env.DATABASE_URL, { max: 10 });
  const app = await buildApp({ env, db });
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
  app.log.info(`Loquia API listening on ${env.API_HOST}:${env.API_PORT}`);

  // No Redis (Render free): the API processes AI Pack jobs in-process. Start the
  // runner AFTER listen so a startup reconcile can't delay readiness; it finishes
  // any job a previous (spun-down) instance left queued, then polls for retryables.
  if (app.ctx.runner) {
    app.ctx.runner
      .start()
      .then(() => app.log.info({ event: 'in_process_runner_started' }, 'in-process AI Pack runner started'))
      .catch((err) => app.log.error({ err }, 'in-process runner failed to start'));
  }

  // Graceful shutdown: stop accepting connections, drain, then close the pool.
  let closing = false;
  const shutdown = async (signal: string) => {
    if (closing) return;
    closing = true;
    app.log.info({ event: 'shutdown_started', signal }, 'shutting down');
    try {
      await app.ctx.runner?.stop(); // halt the poll loop, let an in-flight job settle
      await app.close();
      await close();
      app.log.info({ event: 'shutdown_complete' }, 'shutdown complete');
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'shutdown failed');
      process.exit(1);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('failed to start API', err);
  process.exit(1);
});
