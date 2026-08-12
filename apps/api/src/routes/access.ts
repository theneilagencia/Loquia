import { and, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { activateAccountSchema, requestAccessSchema } from '@loquia/contracts';
import { accessRequests, invitations, userSettings, users, workspaces } from '../db/schema';
import { toInvitationDTO, toSessionDTO } from '../dto';
import { errors } from '../lib/errors';
import { hashPassword, hashToken } from '../lib/crypto';
import { createSession, setSessionCookie } from '../auth/session';
import { writeAudit } from '../services/audit';
import { defaultSettings } from '../services/defaults';

export async function registerAccessRoutes(app: FastifyInstance): Promise<void> {
  const { db, env } = app.ctx;

  // Public: submit an access request (never creates a User).
  app.post(
    '/request',
    { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (request) => {
      const input = requestAccessSchema.parse(request.body);
      const inserted = await db
        .insert(accessRequests)
        .values({
          name: input.name,
          email: input.email.toLowerCase(),
          company: input.company,
          role: input.role,
          useCase: input.useCase,
          preferredLocale: input.preferredLocale,
          status: 'submitted',
        })
        .returning();
      const row = inserted[0]!;
      await writeAudit(db, {
        action: 'request_received',
        actorId: row.id,
        actorLabel: row.name,
        targetType: 'access_request',
        targetId: row.id,
        targetLabel: row.email,
      });
      return { id: row.id };
    },
  );

  // Validate an invitation token (activation screen).
  app.get('/invitation/:token', async (request) => {
    const { token } = request.params as { token: string };
    const rows = await db
      .select()
      .from(invitations)
      .where(eq(invitations.tokenHash, hashToken(token)))
      .limit(1);
    const inv = rows[0];
    if (!inv) return { invitation: null };
    // Reflect expiry without mutating on a GET.
    const status = inv.status === 'pending' && inv.expiresAt < new Date() ? 'expired' : inv.status;
    return { invitation: toInvitationDTO({ ...inv, status }, token) };
  });

  // Activate an account from an invitation (transactional).
  app.post(
    '/activate',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const input = activateAccountSchema.parse(request.body);
      const passwordHash = await hashPassword(input.password);

      const result = await db.transaction(async (tx) => {
        const rows = await tx
          .select()
          .from(invitations)
          .where(eq(invitations.tokenHash, hashToken(input.token)))
          .limit(1);
        const inv = rows[0];
        if (!inv) throw errors.badRequest('invitation_invalid');
        if (inv.status === 'revoked') throw errors.invalidState('invitation_revoked');
        if (inv.status === 'accepted') throw errors.invalidState('invitation_already_used');
        if (inv.status === 'expired' || inv.expiresAt < new Date()) {
          throw errors.invalidState('invitation_expired');
        }

        // The approval created a pending_activation user; activate it (or create).
        const existing = await tx
          .select()
          .from(users)
          .where(and(eq(users.email, inv.email), eq(users.workspaceId, inv.workspaceId)))
          .limit(1);
        let user = existing[0];
        const now = new Date();
        if (user) {
          const updated = await tx
            .update(users)
            .set({ name: input.name, passwordHash, status: 'active', activatedAt: now, updatedAt: now })
            .where(eq(users.id, user.id))
            .returning();
          user = updated[0]!;
        } else {
          const created = await tx
            .insert(users)
            .values({
              email: inv.email,
              name: input.name,
              role: inv.role,
              status: 'active',
              workspaceId: inv.workspaceId,
              passwordHash,
              activatedAt: now,
            })
            .returning();
          user = created[0]!;
        }

        await tx.insert(userSettings).values({
          userId: user.id,
          ...toJsonSettings(user.id),
        }).onConflictDoNothing();

        await tx
          .update(invitations)
          .set({ status: 'accepted', acceptedAt: now })
          .where(eq(invitations.id, inv.id));

        await writeAudit(tx, {
          action: 'account_activated',
          actorId: user.id,
          actorLabel: user.name,
          targetType: 'user',
          targetId: user.id,
          targetLabel: user.email,
          workspaceId: user.workspaceId,
        });

        const wsRows = await tx
          .select()
          .from(workspaces)
          .where(eq(workspaces.id, user.workspaceId))
          .limit(1);
        return { user, workspace: wsRows[0]! };
      });

      const { token, expiresAt } = await createSession(db, result.user.id, request.headers['user-agent']);
      setSessionCookie(reply, token, expiresAt, env);
      return toSessionDTO(result.user, result.workspace);
    },
  );
}

function toJsonSettings(userId: string) {
  const s = defaultSettings(userId);
  return {
    general: s.general,
    recording: s.recording,
    export: s.export,
    language: s.language,
    privacy: s.privacy,
    appearance: s.appearance,
  };
}
