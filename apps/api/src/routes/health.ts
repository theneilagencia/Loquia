import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  // Liveness: the process is up.
  app.get('/health', async () => ({ status: 'ok' }));

  // Readiness: essential dependencies (Postgres) are reachable.
  app.get('/ready', async (_request, reply) => {
    try {
      await app.ctx.db.execute(sql`select 1`);
      return { status: 'ready' };
    } catch {
      return reply.status(503).send({ status: 'not_ready' });
    }
  });
}
