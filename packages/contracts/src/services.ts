import type {
  AccessRequest,
  AIPack,
  AIPackStatus,
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
  ResetPasswordInput,
  InviteUserInput,
  CreateUserInput,
  LoginInput,
  RejectAccessInput,
  RequestAccessInput,
} from './schemas';

/** Result of admin-creating a user: the row, the provisional password (shown
 * once), and the invite token used to build a copyable activation link. */
export interface CreateUserResult {
  user: User;
  provisionalPassword: string;
  inviteToken: string;
}

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
  resetPassword(input: ResetPasswordInput): Promise<Result<{ reset: true }>>;
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
  /** Create a user directly with a provisional password + copyable invite link. */
  createUser(actorId: Id, input: CreateUserInput): Promise<Result<CreateUserResult>>;
  revokeInvitation(id: Id, actorId: Id): Promise<Result<Invitation>>;
  /** Permanently remove an invitation row (pending/revoked/expired cleanup). */
  deleteInvitation(id: Id, actorId: Id): Promise<Result<{ id: Id }>>;
  listUsers(): Promise<User[]>;
  setUserStatus(id: Id, status: User['status'], actorId: Id): Promise<Result<User>>;
  setUserRole(id: Id, role: User['role'], actorId: Id): Promise<Result<User>>;
  /** Permanently remove a user (their meetings are reassigned to the actor). */
  deleteUser(id: Id, actorId: Id): Promise<Result<{ id: Id }>>;
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
  /** Delete a meeting end-to-end (media, transcript, AI pack, exports). */
  remove(id: Id): Promise<Result<{ deleted: true }>>;
  getProcessingJob(meetingId: Id): Promise<ProcessingJob | null>;
  /** Advance the mock pipeline one tick; returns the updated job. */
  tickProcessing(meetingId: Id): Promise<ProcessingJob | null>;
  retryProcessing(meetingId: Id): Promise<Result<ProcessingJob>>;
  /** Resolved AI Pack in the requested output language (synthesized content). */
  getAIPack(meetingId: Id, outputLanguage: string): Promise<AIPack | null>;
  /** Honest AI Pack generation state (not_started/queued/generating/ready/failed). */
  getAIPackStatus(meetingId: Id): Promise<AIPackStatusInfo>;
  /** Start AI Pack generation (async). Reuses an in-flight job. */
  generateAIPack(meetingId: Id): Promise<Result<ProcessingJob>>;
  /** Regenerate: new version; current stays visible until the new one lands. */
  regenerateAIPack(meetingId: Id): Promise<Result<ProcessingJob>>;
}

export interface AIPackStatusInfo {
  status: AIPackStatus;
  hasCurrent: boolean;
  version: number | null;
  provider: string | null;
  model: string | null;
  generatedAt: string | null;
  /** When status is 'failed', the latest job's error code (e.g. 'provider_credits'). */
  failureCode?: string | null;
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

export interface ProcessAudioInput {
  /** The on-device recording. Sent as a raw audio body (never base64). */
  blob: Blob;
  title?: string;
  source: MeetingSource;
  meetingLanguage: string;
  filename: string;
  mimeType: string;
  /** Client-known duration (recorder); enforced against the duration quota. */
  durationSeconds?: number;
}

export interface ProcessAudioResult {
  meetingId: Id;
  processingJobId: Id;
}

/**
 * Text ingest (txt / docx / pasted notes / Plaud transcripts / a link). The
 * content is already text, so it skips transcription and goes straight to AI
 * Pack generation. Provide `text` (extracted client-side) OR `url` (the API
 * fetches and extracts the page's readable text). `sourceLabel` is a filename or
 * URL kept for display.
 */
export interface ProcessTextInput {
  title?: string;
  meetingLanguage: string;
  text?: string;
  url?: string;
  sourceLabel?: string;
}

/**
 * Direct temporary audio processing (Milestone 5.2). There is NO object storage:
 * the browser sends the recording to the API, which transcribes it and discards
 * the media. Playback is local-first (LocalMediaStore), so there is no audio-URL.
 */
export interface MediaService {
  processAudio(input: ProcessAudioInput): Promise<Result<ProcessAudioResult>>;
  /** Retry processing for an existing meeting from the on-device recording (§13/§39). */
  reprocessAudio(meetingId: Id, input: Omit<ProcessAudioInput, 'title' | 'source'>): Promise<Result<ProcessAudioResult>>;
  /** Ingest text (txt/docx/notes/link) straight to AI Pack — no transcription. */
  processText(input: ProcessTextInput): Promise<Result<ProcessAudioResult>>;
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
  media: MediaService;
}
