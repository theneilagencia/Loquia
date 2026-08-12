import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDb } from './client';
import { loadEnv } from '../env';

/** Apply all pending migrations. Used by `pnpm db:migrate` and tests. */
export async function runMigrations(databaseUrl: string): Promise<void> {
  const handle = createDb(databaseUrl, { max: 1 });
  try {
    await migrate(handle.db, { migrationsFolder: new URL('./migrations', import.meta.url).pathname });
  } finally {
    await handle.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const env = loadEnv();
  runMigrations(env.DATABASE_URL)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('migrations applied');
      process.exit(0);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('migration failed', err);
      process.exit(1);
    });
}
