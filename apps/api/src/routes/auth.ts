import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { loginSchema } from '@loquia/contracts';
import { users, workspaces } from '../db/schema';
import { toSessionDTO } from '../dto';
import { errors } from '../lib/errors';
import { verifyPassword } from '../lib/crypto';
import {
  clearSessionCookie,
  createSession,
  revokeSessionByToken,
  SESSION_COOKIE,
  setSessionCookie,
} from '../auth/session';
import { writeAudit } from '../services/audit';

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  const { db, env } = app.ctx;

  // Login — generic failure that never reveals whether the email exists
  // (task §8). Rate-limited to slow enumeration/brute force.
  app.post(
    '/login',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const input = loginSchema.parse(request.body);
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);
      const user = rows[0];

      const genericFail = () => errors.unauthorized('invalid_credentials');

      if (!user || !user.passwordHash || user.status !== 'active') {
        // Do the same work regardless to keep timing/response uniform.
        if (user?.passwordHash) await verifyPassword(input.password, user.passwordHash);
        throw genericFail();
      }
      const ok = await verifyPassword(input.password, user.passwordHash);
      if (!ok) throw genericFail();

      const wsRows = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, user.workspaceId))
        .limit(1);
      const workspace = wsRows[0];
      if (!workspace) throw genericFail();

      const { token, expiresAt } = await createSession(db, user.id, request.headers['user-agent']);
      setSessionCookie(reply, token, expiresAt, env);
      await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));
      await writeAudit(db, {
        action: 'login',
        actorId: user.id,
        actorLabel: user.name,
        targetType: 'user',
        targetId: user.id,
        targetLabel: user.email,
        workspaceId: user.workspaceId,
      });
      return toSessionDTO({ ...user, lastActiveAt: new Date() }, workspace);
    },
  );

  app.post('/logout', async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    if (token) await revokeSessionByToken(db, token);
    if (request.auth) {
      await writeAudit(db, {
        action: 'logout',
        actorId: request.auth.user.id,
        actorLabel: request.auth.user.name,
        targetType: 'user',
        targetId: request.auth.user.id,
        targetLabel: request.auth.user.email,
        workspaceId: request.auth.user.workspaceId,
      });
    }
    clearSessionCookie(reply, env);
    return { ok: true };
  });

  // Current session — used by the web app to restore state after refresh.
  app.get('/session', async (request) => {
    if (!request.auth) return { session: null };
    const wsRows = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, request.auth.user.workspaceId))
      .limit(1);
    const workspace = wsRows[0];
    if (!workspace) return { session: null };
    return { session: toSessionDTO(request.auth.user, workspace) };
  });
}
