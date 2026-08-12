import type {
  AccessRequest,
  AIPack,
  AuditEvent,
  ExportConfig,
  ExportHistoryEntry,
  ExportResult,
  Id,
  Invitation,
  Marker,
  Meeting,
  MeetingSource,
  OnboardingState,
  Paginated,
  ProcessingJob,
  Recording,
  Result,
  Session,
  Settings,
  Speaker,
  Transcript,
  TranscriptSegment,
  User,
  Workspace,
} from '@loquia/domain';
import type {
  ActivateAccountInput,
  ForgotPasswordInput,
  InviteUserInput,
  LoginInput,
  RejectAccessInput,
  RequestAccessInput,
} from './schemas';

/**
 * Service contracts (task spec §11). The UI depends ONLY on these interfaces;
 * concrete adapters (MockAdapter today, ApiAdapter later) are injected via the
 * services container and never imported by components directly.
 */

export interface AuthService {
  getSession(): Promise<Session | null>;
  login(input: LoginInput): Promise<Result<Session>>;
  logout(): Promise<void>;
  forgotPassword(input: ForgotPasswordInput): Promise<Result<{ sent: true }>>;
  activateAccount(input: ActivateAccountInput): Promise<Result<Session>>;
  getInvitationByToken(token: string): Promise<Invitation | null>;
}

export interface AccessService {
  requestAccess(input: RequestAccessInput): Promise<Result<AccessRequest>>;
  getOnboarding(userId: Id): Promise<OnboardingState>;
  advanceOnboarding(userId: Id, step: number): Promise<OnboardingState>;
  completeOnboarding(userId: Id): Promise<OnboardingState>;
}

export interface AdminService {
  listAccessRequests(status?: AccessRequest['status']): Promise<AccessRequest[]>;
  getAccessRequest(id: Id): Promise<AccessRequest | null>;
  approveAccessRequest(id: Id, actorId: Id): Promise<Result<Invitation>>;
  rejectAccessRequest(
    id: Id,
    actorId: Id,
    input: RejectAccessInput,
  ): Promise<Result<AccessRequest>>;
  listInvitations(): Promise<Invitation[]>;
  createInvitation(actorId: Id, input: InviteUserInput): Promise<Result<Invitation>>;
  revokeInvitation(id: Id, actorId: Id): Promise<Result<Invitation>>;
  listUsers(): Promise<User[]>;
  setUserStatus(id: Id, status: User['status'], actorId: Id): Promise<Result<User>>;
  setUserRole(id: Id, role: User['role'], actorId: Id): Promise<Result<User>>;
  listWorkspaces(): Promise<Workspace[]>;
  archiveWorkspace(id: Id, actorId: Id): Promise<Result<Workspace>>;
  listAudit(page?: number, pageSize?: number): Promise<Paginated<AuditEvent>>;
  overview(): Promise<AdminOverview>;
}

export interface AdminOverview {
  pendingRequests: number;
  activeUsers: number;
  workspaces: number;
  meetingsLast30Days: number;
  openInvitations: number;
}

export interface MeetingService {
  list(workspaceId: Id, includeArchived?: boolean): Promise<Meeting[]>;
  get(id: Id): Promise<Meeting | null>;
  create(input: CreateMeetingInput): Promise<Meeting>;
  archive(id: Id): Promise<Result<Meeting>>;
  unarchive(id: Id): Promise<Result<Meeting>>;
  getProcessingJob(meetingId: Id): Promise<ProcessingJob | null>;
  /** Advance the mock pipeline one tick; returns the updated job. */
  tickProcessing(meetingId: Id): Promise<ProcessingJob | null>;
  retryProcessing(meetingId: Id): Promise<Result<ProcessingJob>>;
  /** Resolved AI Pack in the requested output language (synthesized content). */
  getAIPack(meetingId: Id, outputLanguage: string): Promise<AIPack | null>;
}

export interface CreateMeetingInput {
  workspaceId: Id;
  ownerId: Id;
  title: string;
  source: MeetingSource;
  meetingLanguage: string;
  durationSeconds: number;
  recording?: Omit<Recording, 'id' | 'meetingId' | 'createdAt'>;
}

export interface TranscriptService {
  get(meetingId: Id): Promise<Transcript | null>;
  updateSegmentText(
    meetingId: Id,
    segmentId: Id,
    text: string,
  ): Promise<Result<TranscriptSegment>>;
  renameSpeaker(
    meetingId: Id,
    speakerId: Id,
    displayName: string,
  ): Promise<Result<Speaker>>;
  addMarker(meetingId: Id, marker: Omit<Marker, 'id' | 'createdAt'>): Promise<Marker>;
  search(meetingId: Id, query: string): Promise<TranscriptSegment[]>;
}

export interface ExportService {
  /** Single engine (preview = clipboard = download); md/txt/json from one pack. */
  render(config: ExportConfig): Promise<Result<ExportResult>>;
  download(config: ExportConfig): Promise<Result<ExportResult>>;
  copyToClipboard(config: ExportConfig): Promise<Result<ExportResult>>;
  history(meetingId?: Id): Promise<ExportHistoryEntry[]>;
}

export interface SettingsService {
  get(userId: Id): Promise<Settings>;
  update(userId: Id, patch: DeepPartial<Settings>): Promise<Settings>;
}

export interface StorageService {
  /** Reset all mock state back to the seeded baseline. */
  reset(): Promise<void>;
  /** Export the whole mock DB (used by debug tooling / tests). */
  snapshot(): Promise<Record<string, unknown>>;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/** The injectable service container the UI consumes. */
export interface Services {
  auth: AuthService;
  access: AccessService;
  admin: AdminService;
  meetings: MeetingService;
  transcripts: TranscriptService;
  exports: ExportService;
  settings: SettingsService;
  storage: StorageService;
}
