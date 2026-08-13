import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { Queue } from 'bullmq';
import { createRedis, createStorageProvider, MEETING_QUEUE } from '@loquia/pipeline';
import type { AppContext } from './context';
import type { Database } from './db/client';
import type { Env } from './env';
import { isProd } from './env';
import { createEmailProvider } from './email/factory';
import { ApiError, type ErrorResponseBody } from './lib/errors';
import { loadAuth, SESSION_COOKIE } from './auth/session';
import { newId } from './lib/crypto';
import { registerHealthRoutes } from './routes/health';
import { registerAuthRoutes } from './routes/auth';
import { registerAccessRoutes } from './routes/access';
import { registerAdminRoutes } from './routes/admin';
import { registerMeetingRoutes } from './routes/meetings';
import { registerSettingsRoutes } from './routes/settings';
import { registerPresetRoutes } from './routes/presets';
import { registerJobRoutes } from './routes/jobs';
import { registerMediaRoutes } from './routes/media';

/** Assemble the app context (storage provider + queue producer) from env+db. */
export function createContext(env: Env, db: Database): AppContext {
  const storage = createStorageProvider(env, {
    dir: env.MEDIA_MOCK_DIR,
    baseUrl: env.PUBLIC_API_URL ?? `http://localhost:${env.API_PORT}`,
  });

  let queue: Queue | null = null;
  const enqueue = async (processingJobId: string): Promise<void> => {
    if (!env.REDIS_URL) return; // queue disabled (dev without Redis)
    if (!queue) queue = new Queue(MEETING_QUEUE, { connection: createRedis(env.REDIS_URL) });
    await queue.add(
      'process',
      { processingJobId },
      { jobId: processingJobId, attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100, removeOnFail: 500 },
    );
  };

  const email = createEmailProvider(env);
  return { env, db, storage, email, enqueue };
}

export async function buildApp(input: AppContext | { env: Env; db: Database }): Promise<FastifyInstance> {
  const ctx: AppContext =
    'storage' in input ? input : createContext(input.env, input.db);
  const app = Fastify({
    genReqId: () => newId(),
    trustProxy: true,
    logger: {
      level: ctx.env.NODE_ENV === 'test' ? 'silent' : 'info',
      // Never log secrets, tokens, passwords or auth headers.
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          '*.password',
          '*.token',
          '*.passwordHash',
          '*.tokenHash',
          '*.apiKey',
          '*.secretAccessKey',
          '*.access_token',
          '*.uploadUrl',
          '*.downloadUrl',
          '*.presignedUrl',
        ],
        remove: true,
      },
      serializers: {
        req(req) {
          return { method: req.method, url: req.url, id: req.id };
        },
      },
    },
  });

  app.decorate('ctx', ctx);
  app.decorateRequest('auth', null);

  await app.register(cookie, { secret: ctx.env.SESSION_SECRET });
  // CORS: an explicit allowlist (defaults to APP_URL) — never `*` with credentials.
  const allowedOrigins = (ctx.env.CORS_ORIGINS ?? ctx.env.APP_URL)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  await app.register(cors, {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  });
  await app.register(rateLimit, {
    global: false,
    max: ctx.env.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
  });

  // Security headers (no extra dependency; tuned not to break uploads/player).
  // The API serves JSON only, so a strict CSP is safe here.
  app.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Cross-Origin-Resource-Policy', 'same-site');
    reply.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    if (isProd(ctx.env)) {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  });

  // Load the session (if any) on every request.
  app.addHook('onRequest', async (request) => {
    const token = request.cookies[SESSION_COOKIE];
    request.auth = token ? await loadAuth(ctx.db, token) : null;
  });

  app.setErrorHandler((error, request, reply) => {
    const requestId = request.id;
    if (error instanceof ApiError) {
      const body: ErrorResponseBody = {
        error: { code: error.code, message: error.message, requestId, details: error.details },
      };
      return reply.status(error.statusCode).send(body);
    }
    if (error instanceof ZodError) {
      const body: ErrorResponseBody = {
        error: { code: 'validation_error', message: 'Validation failed', requestId, details: error.flatten() },
      };
      return reply.status(422).send(body);
    }
    if ((error as { statusCode?: number }).statusCode === 429) {
      return reply.status(429).send({
        error: { code: 'rate_limited', message: 'Too many requests', requestId },
      } satisfies ErrorResponseBody);
    }
    request.log.error({ err: error, requestId }, 'unhandled error');
    const body: ErrorResponseBody = {
      error: {
        code: 'internal_error',
        message: isProd(ctx.env) ? 'Internal server error' : error.message,
        requestId,
      },
    };
    return reply.status(500).send(body);
  });

  await app.register(registerHealthRoutes);
  await app.register(registerAuthRoutes, { prefix: '/api/auth' });
  await app.register(registerAccessRoutes, { prefix: '/api/access' });
  await app.register(registerAdminRoutes, { prefix: '/api/admin' });
  await app.register(registerMeetingRoutes, { prefix: '/api/meetings' });
  await app.register(registerSettingsRoutes, { prefix: '/api/settings' });
  await app.register(registerPresetRoutes, { prefix: '/api/presets' });
  await app.register(registerJobRoutes, { prefix: '/api/jobs' });
  await app.register(registerMediaRoutes);

  return app;
}
