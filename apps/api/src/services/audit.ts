import type { Database } from '../db/client';
import { auditEvents } from '../db/schema';

/** Server-side audit actions (task §16). Append-only. */
export type ServerAuditAction =
  | 'request_received'
  | 'review_started'
  | 'information_requested'
  | 'approved'
  | 'rejected'
  | 'request_cancelled'
  | 'request_reopened'
  | 'invitation_created'
  | 'user_created'
  | 'invitation_resent'
  | 'invitation_revoked'
  | 'account_activated'
  | 'login'
  | 'logout'
  | 'user_suspended'
  | 'user_reactivated'
  | 'user_deactivated'
  | 'user_deleted'
  | 'workspace_suspended'
  | 'workspace_reactivated'
  | 'export_created'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'meeting_deleted'
  | 'media_deleted';

export interface AuditInput {
  action: ServerAuditAction;
  actorId: string;
  actorLabel: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  workspaceId?: string | null;
  metadata?: Record<string, string>;
}

/** Write an audit event. Accepts a transaction or the base db. */
export async function writeAudit(db: Database, input: AuditInput): Promise<void> {
  await db.insert(auditEvents).values({
    action: input.action,
    actorId: input.actorId,
    actorLabel: input.actorLabel,
    targetType: input.targetType,
    targetId: input.targetId,
    targetLabel: input.targetLabel,
    workspaceId: input.workspaceId ?? null,
    metadata: input.metadata,
  });
}
