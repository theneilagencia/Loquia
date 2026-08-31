import { and, eq, gt, isNull } from 'drizzle-orm';
import type { FastifyReply } from 'fastify';
import type { Database } from '../db/client';
import { sessions, users } from '../db/schema';
import type { Env } from '../env';
import { isProd } from '../env';
import { generateToken, hashToken } from '../lib/crypto';

export const SESSION_COOKIE = 'loquia_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type DbUser = typeof users.$inferSelect;

export interface AuthContext {
  user: DbUser;
  sessionTokenHash: string;
}

export async function createSession(
  db: Database,
  userId: string,
  userAgent?: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({
    tokenHash: hashToken(token),
    userId,
    expiresAt,
    userAgent: userAgent?.slice(0, 256),
  });
  return { token, expiresAt };
}

export async function loadAuth(db: Database, token: string): Promise<AuthContext | null> {
  const tokenHash = hashToken(token);
  const now = new Date();
  const row = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt), gt(sessions.expiresAt, now)))
    .limit(1);
  const session = row[0];
  if (!session) return null;
  const userRow = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const user = userRow[0];
  if (!user || user.status === 'suspended' || user.status === 'deactivated') return null;
  return { user, sessionTokenHash: tokenHash };
}

export async function revokeSessionByToken(db: Database, token: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, hashToken(token)));
}

/** Revoke every active session for a user (e.g. after a password reset). */
export async function revokeAllSessionsForUser(db: Database, userId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

/**
 * SameSite for the session cookie. Cross-site deploys (web + API on different
 * sites, e.g. loquia-web / loquia-api on *.onrender.com) MUST use 'none' or the
 * browser drops the cookie on cross-origin fetches — the login POST returns 200
 * but no session is stored. Defaults to 'none' in production, 'lax' otherwise.
 */
function cookieSameSite(env: Env): 'lax' | 'none' | 'strict' {
  return env.COOKIE_SAMESITE ?? (isProd(env) ? 'none' : 'lax');
}

export function setSessionCookie(
  reply: FastifyReply,
  token: string,
  expiresAt: Date,
  env: Env,
): void {
  const sameSite = cookieSameSite(env);
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    // SameSite=None is only honored on a Secure cookie.
    secure: isProd(env) || sameSite === 'none',
    sameSite,
    path: '/',
    expires: expiresAt,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

export function clearSessionCookie(reply: FastifyReply, env: Env): void {
  const sameSite = cookieSameSite(env);
  reply.clearCookie(SESSION_COOKIE, {
    path: '/',
    // Match the set attributes so the browser actually clears the cookie.
    secure: isProd(env) || sameSite === 'none',
    sameSite,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}
