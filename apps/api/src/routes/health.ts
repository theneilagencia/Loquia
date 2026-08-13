import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { createRedis } from '@loquia/pipeline';

/** Bounded Redis PING — never blocks readiness for long on a slow/unreachable queue. */
async function pingQueue(url: string, timeoutMs = 1500): Promise<boolean> {
  const client = createRedis(url);
  try {
    const pong = await Promise.race([
      client.ping(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    return pong === 'PONG';
  } catch {
    return false;
  } finally {
    client.disconnect();
  }
}

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  // Liveness: the process is up. Never touches external dependencies (so a
  // third-party outage can't make the platform kill a healthy process).
  app.get('/health', async () => ({ status: 'ok' }));

  // Readiness: Postgres is the hard gate (the API cannot serve without it). The
  // queue is reported for observability but does NOT fail readiness — the API
  // still serves reads during a Redis blip, and enqueue is resilient. External
  // providers (R2/Deepgram/Anthropic/email) are intentionally NOT checked here
  // so their outage never takes the API down (task §43).
  app.get('/ready', async (_request, reply) => {
    const checks: Record<string, 'up' | 'down' | 'skipped'> = { db: 'down', queue: 'skipped' };
    try {
      await app.ctx.db.execute(sql`select 1`);
      checks.db = 'up';
    } catch {
      return reply.status(503).send({ status: 'not_ready', checks });
    }
    if (app.ctx.env.REDIS_URL) {
      checks.queue = (await pingQueue(app.ctx.env.REDIS_URL)) ? 'up' : 'down';
    }
    return { status: 'ready', checks };
  });
}
