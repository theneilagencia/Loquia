import { and, eq, gt, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from '@loquia/contracts';
import { passwordResetTokens, users, workspaces } from '../db/schema';
import { toSessionDTO } from '../dto';
import { errors } from '../lib/errors';
import { generateToken, hashPassword, hashToken, verifyPassword } from '../lib/crypto';
import {
  clearSessionCookie,
  createSession,
  revokeAllSessionsForUser,
  revokeSessionByToken,
  SESSION_COOKIE,
  setSessionCookie,
} from '../auth/session';
import { writeAudit } from '../services/audit';
import { sendPasswordResetEmail } from '../services/notifications';

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  const { db, env } = app.ctx;
  const ctx = app.ctx;

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

      const genericFail = () => {
        // Operational signal for abuse monitoring — never logs the password/email content.
        request.log.info({ event: 'auth_login_failed' }, 'login failed');
        return errors.unauthorized('invalid_credentials');
      };

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

  // Forgot password — always returns a generic response (never reveals whether
  // the email exists). Creates a single-use, hashed, expiring token and emails
  // a reset link. Rate-limited to slow enumeration/abuse.
  app.post(
    '/forgot-password',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request) => {
      const { email } = forgotPasswordSchema.parse(request.body);
      const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      const user = rows[0];
      if (user && user.status === 'active') {
        const token = generateToken();
        const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
        await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash: hashToken(token), expiresAt });
        await writeAudit(db, { action: 'password_reset_requested', actorId: user.id, actorLabel: user.name, targetType: 'user', targetId: user.id, targetLabel: user.email, workspaceId: user.workspaceId });
        await sendPasswordResetEmail(ctx, request.log, { email: user.email, name: user.name, token, expiresAt, locale: user.locale });
      } else {
        // Log the attempt without revealing existence; no email sent.
        request.log.info({ event: 'password_reset_requested', exists: false }, 'forgot password (no active user)');
      }
      return { sent: true };
    },
  );

  // Reset password — validate the token, set the new password, revoke ALL of the
  // user's sessions, mark the token used, audit. Rate-limited.
  app.post(
    '/reset-password',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request) => {
      const input = resetPasswordSchema.parse(request.body);
      const now = new Date();
      const rows = await db
        .select()
        .from(passwordResetTokens)
        .where(and(eq(passwordResetTokens.tokenHash, hashToken(input.token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, now)))
        .limit(1);
      const prt = rows[0];
      if (!prt) throw errors.badRequest('reset_token_invalid');
      const passwordHash = await hashPassword(input.password);
      await db.transaction(async (tx) => {
        await tx.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, prt.userId));
        await tx.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.id, prt.id));
        await revokeAllSessionsForUser(tx, prt.userId);
        const u = (await tx.select().from(users).where(eq(users.id, prt.userId)).limit(1))[0]!;
        await writeAudit(tx, { action: 'password_reset_completed', actorId: u.id, actorLabel: u.name, targetType: 'user', targetId: u.id, targetLabel: u.email, workspaceId: u.workspaceId });
      });
      return { reset: true };
    },
  );

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
