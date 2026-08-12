import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { rejectAccessSchema, inviteUserSchema } from '@loquia/contracts';
import {
  accessRequests,
  auditEvents,
  invitations,
  meetings,
  users,
  workspaces,
} from '../db/schema';
import {
  toAccessRequestDTO,
  toAuditDTO,
  toInvitationDTO,
  toUserDTO,
  toWorkspaceDTO,
} from '../dto';
import { requireAdmin, assertWorkspace } from '../context';
import { errors } from '../lib/errors';
import { generateToken, hashToken } from '../lib/crypto';
import { writeAudit, type ServerAuditAction } from '../services/audit';

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'workspace'
  );
}

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  const { db } = app.ctx;

  // ---- Access requests ----
  app.get('/access-requests', async (request) => {
    requireAdmin(request.auth);
    const q = z.object({ status: z.string().optional() }).parse(request.query);
    const rows = await db.select().from(accessRequests).orderBy(desc(accessRequests.createdAt));
    const mapped = rows.map(toAccessRequestDTO);
    return q.status ? mapped.filter((r) => r.status === q.status) : mapped;
  });

  app.get('/access-requests/:id', async (request) => {
    requireAdmin(request.auth);
    const { id } = request.params as { id: string };
    const rows = await db.select().from(accessRequests).where(eq(accessRequests.id, id)).limit(1);
    if (!rows[0]) throw errors.notFound();
    return toAccessRequestDTO(rows[0]);
  });

  // Simple lifecycle transitions (start review / request info / cancel / reopen).
  const transitions: Record<string, { status: string; action: ServerAuditAction }> = {
    'start-review': { status: 'under_review', action: 'review_started' },
    'request-info': { status: 'more_information_required', action: 'information_requested' },
    cancel: { status: 'cancelled', action: 'request_cancelled' },
    reopen: { status: 'under_review', action: 'request_reopened' },
  };
  for (const [path, t] of Object.entries(transitions)) {
    app.post(`/access-requests/:id/${path}`, async (request) => {
      const admin = requireAdmin(request.auth);
      const { id } = request.params as { id: string };
      const rows = await db
        .update(accessRequests)
        .set({ status: t.status as never, reviewerUserId: admin.user.id, updatedAt: new Date() })
        .where(eq(accessRequests.id, id))
        .returning();
      if (!rows[0]) throw errors.notFound();
      await writeAudit(db, {
        action: t.action,
        actorId: admin.user.id,
        actorLabel: admin.user.name,
        targetType: 'access_request',
        targetId: id,
        targetLabel: rows[0].email,
      });
      return toAccessRequestDTO(rows[0]);
    });
  }

  // Approve — transactional (task §10): workspace + user + invitation + audit.
  app.post('/access-requests/:id/approve', async (request) => {
    const admin = requireAdmin(request.auth);
    const { id } = request.params as { id: string };
    const token = generateToken();

    const result = await db.transaction(async (tx) => {
      const reqRows = await tx.select().from(accessRequests).where(eq(accessRequests.id, id)).limit(1);
      const req = reqRows[0];
      if (!req) throw errors.notFound();
      if (req.status === 'approved') throw errors.invalidState('already_approved');

      const now = new Date();
      const wsInsert = await tx
        .insert(workspaces)
        .values({ name: req.company, slug: slugify(req.company), plan: 'trial', seats: 5 })
        .returning();
      const workspace = wsInsert[0]!;

      const userInsert = await tx
        .insert(users)
        .values({
          email: req.email,
          name: req.name,
          role: 'owner',
          status: 'pending_activation',
          workspaceId: workspace.id,
          locale: req.preferredLocale,
        })
        .returning();
      const user = userInsert[0]!;
      await tx.update(workspaces).set({ ownerUserId: user.id }).where(eq(workspaces.id, workspace.id));

      const invInsert = await tx
        .insert(invitations)
        .values({
          email: req.email,
          workspaceId: workspace.id,
          role: 'owner',
          tokenHash: hashToken(token),
          status: 'pending',
          accessRequestId: req.id,
          invitedByUserId: admin.user.id,
          expiresAt: new Date(now.getTime() + INVITE_TTL_MS),
        })
        .returning();
      const invitation = invInsert[0]!;

      await tx
        .update(accessRequests)
        .set({ status: 'approved', reviewerUserId: admin.user.id, reviewedAt: now, invitationId: invitation.id, updatedAt: now })
        .where(eq(accessRequests.id, id));

      await writeAudit(tx, { action: 'approved', actorId: admin.user.id, actorLabel: admin.user.name, targetType: 'access_request', targetId: id, targetLabel: req.email, workspaceId: workspace.id });
      await writeAudit(tx, { action: 'invitation_created', actorId: admin.user.id, actorLabel: admin.user.name, targetType: 'invitation', targetId: invitation.id, targetLabel: req.email, workspaceId: workspace.id });

      return invitation;
    });

    // Echo the plaintext token once (activation link); only the hash is stored.
    return toInvitationDTO(result, token);
  });

  app.post('/access-requests/:id/reject', async (request) => {
    const admin = requireAdmin(request.auth);
    const { id } = request.params as { id: string };
    const input = rejectAccessSchema.parse(request.body);
    const rows = await db
      .update(accessRequests)
      .set({ status: 'rejected', reviewerUserId: admin.user.id, reviewedAt: new Date(), rejectionReason: input.reason, updatedAt: new Date() })
      .where(eq(accessRequests.id, id))
      .returning();
    if (!rows[0]) throw errors.notFound();
    await writeAudit(db, { action: 'rejected', actorId: admin.user.id, actorLabel: admin.user.name, targetType: 'access_request', targetId: id, targetLabel: rows[0].email });
    return toAccessRequestDTO(rows[0]);
  });

  // ---- Invitations (workspace-scoped) ----
  app.get('/invitations', async (request) => {
    const admin = requireAdmin(request.auth);
    const rows = await db
      .select()
      .from(invitations)
      .where(eq(invitations.workspaceId, admin.user.workspaceId))
      .orderBy(desc(invitations.createdAt));
    return rows.map((r) => toInvitationDTO(r));
  });

  app.post('/invitations', async (request) => {
    const admin = requireAdmin(request.auth);
    const input = inviteUserSchema.parse(request.body);
    const token = generateToken();
    const rows = await db
      .insert(invitations)
      .values({
        email: input.email.toLowerCase(),
        workspaceId: admin.user.workspaceId,
        role: input.role,
        tokenHash: hashToken(token),
        status: 'pending',
        invitedByUserId: admin.user.id,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      })
      .returning();
    await writeAudit(db, { action: 'invitation_created', actorId: admin.user.id, actorLabel: admin.user.name, targetType: 'invitation', targetId: rows[0]!.id, targetLabel: input.email, workspaceId: admin.user.workspaceId });
    return toInvitationDTO(rows[0]!, token);
  });

  app.post('/invitations/:id/resend', async (request) => {
    const admin = requireAdmin(request.auth);
    const { id } = request.params as { id: string };
    const existing = await db.select().from(invitations).where(eq(invitations.id, id)).limit(1);
    if (!existing[0]) throw errors.notFound();
    assertWorkspace(admin, existing[0].workspaceId);
    const token = generateToken(); // invalidates the previous token
    const rows = await db
      .update(invitations)
      .set({ tokenHash: hashToken(token), status: 'pending', expiresAt: new Date(Date.now() + INVITE_TTL_MS) })
      .where(eq(invitations.id, id))
      .returning();
    await writeAudit(db, { action: 'invitation_resent', actorId: admin.user.id, actorLabel: admin.user.name, targetType: 'invitation', targetId: id, targetLabel: rows[0]!.email, workspaceId: admin.user.workspaceId });
    return toInvitationDTO(rows[0]!, token);
  });

  app.post('/invitations/:id/revoke', async (request) => {
    const admin = requireAdmin(request.auth);
    const { id } = request.params as { id: string };
    const existing = await db.select().from(invitations).where(eq(invitations.id, id)).limit(1);
    if (!existing[0]) throw errors.notFound();
    assertWorkspace(admin, existing[0].workspaceId);
    const rows = await db.update(invitations).set({ status: 'revoked' }).where(eq(invitations.id, id)).returning();
    await writeAudit(db, { action: 'invitation_revoked', actorId: admin.user.id, actorLabel: admin.user.name, targetType: 'invitation', targetId: id, targetLabel: rows[0]!.email, workspaceId: admin.user.workspaceId });
    return toInvitationDTO(rows[0]!);
  });

  // ---- Users (workspace-scoped) ----
  app.get('/users', async (request) => {
    const admin = requireAdmin(request.auth);
    const rows = await db.select().from(users).where(eq(users.workspaceId, admin.user.workspaceId));
    return rows.map(toUserDTO);
  });

  app.patch('/users/:id/status', async (request) => {
    const admin = requireAdmin(request.auth);
    const { id } = request.params as { id: string };
    const { status } = z.object({ status: z.enum(['active', 'suspended', 'deactivated', 'invited']) }).parse(request.body);
    const dbStatus = status === 'invited' ? 'pending_activation' : status;
    const target = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!target[0]) throw errors.notFound();
    assertWorkspace(admin, target[0].workspaceId);
    const rows = await db.update(users).set({ status: dbStatus, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    const action: ServerAuditAction = status === 'active' ? 'user_reactivated' : status === 'deactivated' ? 'user_deactivated' : 'user_suspended';
    await writeAudit(db, { action, actorId: admin.user.id, actorLabel: admin.user.name, targetType: 'user', targetId: id, targetLabel: rows[0]!.email, workspaceId: admin.user.workspaceId });
    return toUserDTO(rows[0]!);
  });

  app.patch('/users/:id/role', async (request) => {
    const admin = requireAdmin(request.auth);
    const { id } = request.params as { id: string };
    const { role } = z.object({ role: z.enum(['owner', 'admin', 'member']) }).parse(request.body);
    const target = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!target[0]) throw errors.notFound();
    assertWorkspace(admin, target[0].workspaceId);
    const rows = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return toUserDTO(rows[0]!);
  });

  // ---- Workspaces ----
  app.get('/workspaces', async (request) => {
    const admin = requireAdmin(request.auth);
    const rows = await db.select().from(workspaces).where(eq(workspaces.id, admin.user.workspaceId));
    return rows.map(toWorkspaceDTO);
  });

  app.post('/workspaces/:id/archive', async (request) => {
    const admin = requireAdmin(request.auth);
    const { id } = request.params as { id: string };
    assertWorkspace(admin, id);
    const rows = await db.update(workspaces).set({ archived: true, status: 'suspended', updatedAt: new Date() }).where(eq(workspaces.id, id)).returning();
    if (!rows[0]) throw errors.notFound();
    await writeAudit(db, { action: 'workspace_suspended', actorId: admin.user.id, actorLabel: admin.user.name, targetType: 'workspace', targetId: id, targetLabel: rows[0].name, workspaceId: id });
    return toWorkspaceDTO(rows[0]);
  });

  // ---- Audit (append-only, read-only) ----
  app.get('/audit', async (request) => {
    const admin = requireAdmin(request.auth);
    const { page, pageSize } = z
      .object({ page: z.coerce.number().default(1), pageSize: z.coerce.number().default(20) })
      .parse(request.query);
    const where = eq(auditEvents.workspaceId, admin.user.workspaceId);
    const rows = await db
      .select()
      .from(auditEvents)
      .where(where)
      .orderBy(desc(auditEvents.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    const totalRows = await db.select({ n: sql<number>`count(*)::int` }).from(auditEvents).where(where);
    return { items: rows.map(toAuditDTO), total: totalRows[0]?.n ?? 0, page, pageSize };
  });

  // ---- Overview ----
  app.get('/overview', async (request) => {
    const admin = requireAdmin(request.auth);
    const ws = admin.user.workspaceId;
    const pending = await db.select({ n: sql<number>`count(*)::int` }).from(accessRequests).where(inArray(accessRequests.status, ['submitted', 'under_review', 'more_information_required']));
    const activeUsers = await db.select({ n: sql<number>`count(*)::int` }).from(users).where(and(eq(users.workspaceId, ws), eq(users.status, 'active')));
    const meetingsCount = await db.select({ n: sql<number>`count(*)::int` }).from(meetings).where(eq(meetings.workspaceId, ws));
    const openInv = await db.select({ n: sql<number>`count(*)::int` }).from(invitations).where(and(eq(invitations.workspaceId, ws), eq(invitations.status, 'pending')));
    return {
      pendingRequests: pending[0]?.n ?? 0,
      activeUsers: activeUsers[0]?.n ?? 0,
      workspaces: 1,
      meetingsLast30Days: meetingsCount[0]?.n ?? 0,
      openInvitations: openInv[0]?.n ?? 0,
    };
  });
}
