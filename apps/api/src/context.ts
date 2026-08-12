import type { Database } from './db/client';
import type { Env } from './env';
import type { AuthContext } from './auth/session';
import { errors } from './lib/errors';

export interface AppContext {
  env: Env;
  db: Database;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext | null;
  }
  interface FastifyInstance {
    ctx: AppContext;
  }
}

/** Guard helpers used inside route handlers. */
export function requireAuth(auth: AuthContext | null): AuthContext {
  if (!auth) throw errors.unauthorized();
  return auth;
}

export function requireAdmin(auth: AuthContext | null): AuthContext {
  const ctx = requireAuth(auth);
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'owner') {
    throw errors.forbidden('Admin role required');
  }
  return ctx;
}

/** Workspace isolation: the resource's workspace must match the caller's. */
export function assertWorkspace(auth: AuthContext, workspaceId: string): void {
  if (auth.user.workspaceId !== workspaceId) {
    throw errors.notFound(); // do not reveal cross-workspace existence
  }
}
