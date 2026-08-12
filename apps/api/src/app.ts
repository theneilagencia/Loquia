import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import type { AppContext } from './context';
import { isProd } from './env';
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

export async function buildApp(ctx: AppContext): Promise<FastifyInstance> {
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
  await app.register(cors, {
    origin: ctx.env.APP_URL,
    credentials: true,
  });
  await app.register(rateLimit, {
    global: false,
    max: ctx.env.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
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

  return app;
}
