import type {
  AccessRequest,
  AuditEvent,
  Invitation,
  Meeting,
  ProcessingJob,
  Session,
  Settings,
  User,
  Workspace,
} from '@loquia/domain';
import type {
  accessRequests,
  auditEvents,
  invitations,
  meetings,
  processingJobs,
  userSettings,
  users,
  workspaces,
} from './db/schema';

const iso = (d: Date | null | undefined): string | undefined =>
  d ? new Date(d).toISOString() : undefined;

/** DB user status → frontend domain status (invited/active/suspended). */
function userStatus(s: string): User['status'] {
  if (s === 'active') return 'active';
  if (s === 'pending_activation') return 'invited';
  return 'suspended';
}

export function toUserDTO(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: userStatus(row.status),
    workspaceId: row.workspaceId,
    locale: row.locale as User['locale'],
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    lastActiveAt: iso(row.lastActiveAt),
  };
}

export function toWorkspaceDTO(row: typeof workspaces.$inferSelect): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan as Workspace['plan'],
    seats: row.seats,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    archived: row.archived,
  };
}

export function toSessionDTO(
  user: typeof users.$inferSelect,
  workspace: typeof workspaces.$inferSelect,
): Session {
  return {
    user: toUserDTO(user),
    workspace: toWorkspaceDTO(workspace),
    isAdmin: user.role === 'admin' || user.role === 'owner',
  };
}

function accessStatus(s: string): AccessRequest['status'] {
  if (s === 'approved') return 'approved';
  if (s === 'rejected' || s === 'cancelled' || s === 'expired') return 'rejected';
  return 'pending';
}

export function toAccessRequestDTO(row: typeof accessRequests.$inferSelect): AccessRequest {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    role: row.role,
    useCase: row.useCase,
    preferredLocale: row.preferredLocale as AccessRequest['preferredLocale'],
    status: accessStatus(row.status),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    reviewedByUserId: row.reviewerUserId ?? undefined,
    reviewedAt: iso(row.reviewedAt),
    rejectionReason: row.rejectionReason ?? undefined,
    invitationId: row.invitationId ?? undefined,
  };
}

export function toInvitationDTO(
  row: typeof invitations.$inferSelect,
  tokenEcho?: string,
): Invitation {
  const status: Invitation['status'] = row.status === 'pending' ? 'sent' : row.status;
  return {
    id: row.id,
    email: row.email,
    workspaceId: row.workspaceId,
    role: row.role,
    token: tokenEcho ?? '',
    status,
    accessRequestId: row.accessRequestId ?? undefined,
    invitedByUserId: row.invitedByUserId,
    createdAt: new Date(row.createdAt).toISOString(),
    expiresAt: new Date(row.expiresAt).toISOString(),
    acceptedAt: iso(row.acceptedAt),
  };
}

export function toMeetingDTO(row: typeof meetings.$inferSelect): Meeting {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    ownerId: row.ownerId,
    title: row.title,
    source: row.source,
    status: row.status,
    meetingLanguage: row.meetingLanguage,
    durationSeconds: row.durationSeconds,
    participantCount: row.participantCount,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    archivedAt: iso(row.archivedAt),
    recordingId: row.recordingAudioRef ? row.id : undefined,
    aiPackStatus: row.aiPackStatus,
    summaryLine: row.summaryLine ?? undefined,
  };
}

export function toProcessingJobDTO(row: typeof processingJobs.$inferSelect): ProcessingJob {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    meetingId: row.meetingId,
    type: row.type,
    status: row.status,
    stage: row.stage,
    progress: row.progress,
    attempt: row.attempt,
    maxAttempts: row.maxAttempts,
    errorCode: row.errorCode ?? undefined,
    errorMessage: row.errorMessage ?? undefined,
    createdAt: new Date(row.createdAt).toISOString(),
    startedAt: iso(row.startedAt),
    completedAt: iso(row.completedAt),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function toAuditDTO(row: typeof auditEvents.$inferSelect): AuditEvent {
  return {
    id: row.id,
    action: row.action as AuditEvent['action'],
    actorId: row.actorId,
    actorLabel: row.actorLabel,
    targetType: row.targetType as AuditEvent['targetType'],
    targetId: row.targetId,
    targetLabel: row.targetLabel,
    metadata: row.metadata ?? undefined,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export function toSettingsDTO(row: typeof userSettings.$inferSelect): Settings {
  return {
    userId: row.userId,
    general: row.general as Settings['general'],
    recording: row.recording as Settings['recording'],
    export: row.export as Settings['export'],
    language: row.language as Settings['language'],
    privacy: row.privacy as Settings['privacy'],
    appearance: row.appearance as Settings['appearance'],
  };
}
