import { buildApp } from './app';
import { createDb } from './db/client';
import { loadEnv } from './env';

async function main(): Promise<void> {
  const env = loadEnv();
  const { db } = createDb(env.DATABASE_URL);
  const app = await buildApp({ env, db });
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
  app.log.info(`Loquia API listening on ${env.API_HOST}:${env.API_PORT}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('failed to start API', err);
  process.exit(1);
});
