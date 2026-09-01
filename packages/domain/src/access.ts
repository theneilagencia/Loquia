import type { Id, ISODateString, LanguageTag, Locale } from './common';

/**
 * Access & identity domain.
 *
 * Key decision (from task spec §20): AccessRequest and User are SEPARATE
 * entities. A request is a lead in the intake funnel; a User only exists after
 * an approved request produces an accepted invitation.
 */

export type UserRole = 'owner' | 'admin' | 'member';

export type UserStatus = 'invited' | 'active' | 'suspended';

export interface User {
  id: Id;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  workspaceId: Id;
  locale: Locale;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  lastActiveAt?: ISODateString;
}

export type WorkspacePlan = 'trial' | 'pro' | 'enterprise';

export interface Workspace {
  id: Id;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  seats: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  archived: boolean;
}

export type AccessRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

export interface AccessRequest {
  id: Id;
  name: string;
  email: string;
  company: string;
  role: string;
  useCase: string;
  preferredLocale: Locale;
  status: AccessRequestStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  /** Set when moved out of `pending`. */
  reviewedByUserId?: Id;
  reviewedAt?: ISODateString;
  rejectionReason?: string;
  /** Set when approval spawns an invitation. */
  invitationId?: Id;
}

export type InvitationStatus =
  | 'sent'
  | 'accepted'
  | 'expired'
  | 'revoked';

export interface Invitation {
  id: Id;
  email: string;
  workspaceId: Id;
  role: UserRole;
  token: string;
  status: InvitationStatus;
  accessRequestId?: Id;
  invitedByUserId: Id;
  createdAt: ISODateString;
  expiresAt: ISODateString;
  acceptedAt?: ISODateString;
}

export type AuditAction =
  | 'access_request.created'
  | 'access_request.approved'
  | 'access_request.rejected'
  | 'invitation.sent'
  | 'invitation.revoked'
  | 'invitation.accepted'
  | 'user.activated'
  | 'user.suspended'
  | 'user.role_changed'
  | 'user.deleted'
  | 'workspace.created'
  | 'workspace.archived'
  | 'meeting.created'
  | 'meeting.archived'
  | 'export.created';

export interface AuditEvent {
  id: Id;
  action: AuditAction;
  actorId: Id;
  actorLabel: string;
  targetType: 'access_request' | 'invitation' | 'user' | 'workspace' | 'meeting' | 'export';
  targetId: Id;
  targetLabel: string;
  metadata?: Record<string, string>;
  createdAt: ISODateString;
}

/** Authenticated session — mock only in Milestone 1. */
export interface Session {
  user: User;
  workspace: Workspace;
  isAdmin: boolean;
}

export interface OnboardingState {
  userId: Id;
  completed: boolean;
  currentStep: number;
  totalSteps: number;
  meetingLanguage: LanguageTag;
  completedAt?: ISODateString;
}
