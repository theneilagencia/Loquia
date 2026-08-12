import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import type {
  AIPackStatus,
  AuditAction,
  ExportFormat,
  MeetingSource,
  MeetingStatus,
  PackSize,
  PresetId,
  ProcessingJobStatus,
  ProcessingJobType,
  ProcessingStage,
  UserRole,
} from '@loquia/domain';

/**
 * Loquia database schema (Drizzle + PostgreSQL). Timestamps are UTC
 * (timestamptz). IDs are server-generated UUIDs. Every workspace-owned entity
 * carries an explicit workspace_id for isolation.
 */

const id = () => text('id').primaryKey().default(sql`gen_random_uuid()`);
const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const workspaces = pgTable('workspaces', {
  id: id(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  plan: text('plan').notNull().default('trial'),
  seats: integer('seats').notNull().default(5),
  ownerUserId: text('owner_user_id'),
  status: text('status').$type<'active' | 'suspended'>().notNull().default('active'),
  archived: boolean('archived').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const users = pgTable(
  'users',
  {
    id: id(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    role: text('role').$type<UserRole>().notNull().default('member'),
    status: text('status')
      .$type<'pending_activation' | 'active' | 'suspended' | 'deactivated'>()
      .notNull()
      .default('pending_activation'),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    locale: text('locale').notNull().default('pt-BR'),
    passwordHash: text('password_hash'),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({ emailIdx: uniqueIndex('users_email_idx').on(t.email) }),
);

export const sessions = pgTable(
  'sessions',
  {
    /** Primary key is the sha256 hash of the opaque cookie token. */
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    userAgent: text('user_agent'),
  },
  (t) => ({ userIdx: index('sessions_user_idx').on(t.userId) }),
);

export const accessRequests = pgTable('access_requests', {
  id: id(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company').notNull(),
  role: text('role').notNull(),
  useCase: text('use_case').notNull(),
  preferredLocale: text('preferred_locale').notNull().default('pt-BR'),
  status: text('status')
    .$type<'submitted' | 'under_review' | 'more_information_required' | 'approved' | 'rejected' | 'cancelled' | 'expired'>()
    .notNull()
    .default('submitted'),
  reviewerUserId: text('reviewer_user_id'),
  internalNotes: text('internal_notes').notNull().default(''),
  invitationId: text('invitation_id'),
  rejectionReason: text('rejection_reason'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const invitations = pgTable(
  'invitations',
  {
    id: id(),
    email: text('email').notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    role: text('role').$type<UserRole>().notNull().default('member'),
    /** sha256 of the invitation token — plaintext is never stored/logged. */
    tokenHash: text('token_hash').notNull(),
    status: text('status')
      .$type<'pending' | 'accepted' | 'expired' | 'revoked'>()
      .notNull()
      .default('pending'),
    accessRequestId: text('access_request_id'),
    invitedByUserId: text('invited_by_user_id').notNull(),
    createdAt: createdAt(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  },
  (t) => ({ tokenIdx: index('invitations_token_idx').on(t.tokenHash) }),
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: id(),
    action: text('action').$type<AuditAction | string>().notNull(),
    actorId: text('actor_id').notNull(),
    actorLabel: text('actor_label').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    targetLabel: text('target_label').notNull(),
    workspaceId: text('workspace_id'),
    metadata: jsonb('metadata').$type<Record<string, string>>(),
    createdAt: createdAt(),
  },
  (t) => ({
    targetIdx: index('audit_target_idx').on(t.targetType, t.targetId),
    wsIdx: index('audit_workspace_idx').on(t.workspaceId),
  }),
);

export const meetings = pgTable(
  'meetings',
  {
    id: id(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id),
    title: text('title').notNull(),
    source: text('source').$type<MeetingSource>().notNull(),
    status: text('status').$type<MeetingStatus>().notNull().default('processing'),
    /** AI Pack generation state, independent of the transcript `status`. */
    aiPackStatus: text('ai_pack_status')
      .$type<AIPackStatus>()
      .notNull()
      .default('not_started'),
    meetingLanguage: text('meeting_language').notNull().default('pt-BR'),
    /** Language detected by the transcription provider (may differ from declared). */
    detectedLanguage: text('detected_language'),
    durationSeconds: integer('duration_seconds').notNull().default(0),
    participantCount: integer('participant_count').notNull().default(0),
    summaryLine: text('summary_line'),
    recordingAudioRef: text('recording_audio_ref'),
    waveformPeaks: jsonb('waveform_peaks').$type<number[]>(),
    speakerAliases: jsonb('speaker_aliases').$type<Record<string, string>>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (t) => ({ wsIdx: index('meetings_workspace_idx').on(t.workspaceId) }),
);

export const participants = pgTable('participants', {
  id: id(),
  meetingId: text('meeting_id')
    .notNull()
    .references(() => meetings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  organization: text('organization'),
  isExternal: boolean('is_external').notNull().default(false),
});

export const transcriptSegments = pgTable(
  'transcript_segments',
  {
    id: id(),
    workspaceId: text('workspace_id'),
    meetingId: text('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    speakerKey: text('speaker_key').notNull(),
    orderIndex: integer('order_index').notNull().default(0),
    sequence: integer('sequence').notNull().default(0),
    startSeconds: integer('start_seconds').notNull(),
    endSeconds: integer('end_seconds').notNull(),
    /** Millisecond-precision timestamps from the provider. */
    startMs: integer('start_ms'),
    endMs: integer('end_ms'),
    text: text('text').notNull(),
    confidence: text('confidence'),
    edited: boolean('edited').notNull().default(false),
    editedAt: timestamp('edited_at', { withTimezone: true }),
    editedBy: text('edited_by'),
    language: text('language').notNull().default('pt-BR'),
  },
  (t) => ({ meetingIdx: index('segments_meeting_idx').on(t.meetingId) }),
);

/** Media asset stored in object storage (task §6). */
export const mediaAssets = pgTable(
  'media_assets',
  {
    id: id(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    meetingId: text('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    storageProvider: text('storage_provider').notNull(),
    bucket: text('bucket').notNull(),
    objectKey: text('object_key').notNull(),
    originalFilename: text('original_filename').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes'),
    durationMs: integer('duration_ms'),
    status: text('status')
      .$type<'pending_upload' | 'uploaded' | 'processing' | 'ready' | 'failed' | 'deleted'>()
      .notNull()
      .default('pending_upload'),
    sha256: text('sha256'),
    /** Retention expiry (privacy settings); a cleanup job can act on it. */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: createdAt(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({ meetingIdx: index('media_meeting_idx').on(t.meetingId) }),
);

export const markers = pgTable('markers', {
  id: id(),
  meetingId: text('meeting_id')
    .notNull()
    .references(() => meetings.id, { onDelete: 'cascade' }),
  atSeconds: integer('at_seconds').notNull(),
  label: text('label').notNull(),
  kind: text('kind').$type<'user' | 'auto'>().notNull().default('user'),
  createdAt: createdAt(),
});

/**
 * AI Pack storage (Milestone 4). Each generation is an immutable VERSION row;
 * exactly one row per meeting is `isCurrent`. The bilingual pack source is
 * stored as JSONB (`PackSource.sections`) so the shared export engine resolves
 * and renders it unchanged. `generationKey` makes persistence idempotent: a
 * retried job that already wrote its version cannot create a second one.
 */
export const aiPacks = pgTable(
  'ai_packs',
  {
    id: id(),
    workspaceId: text('workspace_id'),
    meetingId: text('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    version: integer('version').notNull().default(1),
    /** Exactly one current version per meeting (partial unique index below). */
    isCurrent: boolean('is_current').notNull().default(true),
    status: text('status').$type<'ready' | 'failed'>().notNull().default('ready'),
    /** Language the structured content was generated in. */
    outputLanguage: text('output_language').notNull().default('pt-BR'),
    provider: text('provider').notNull().default('demo'),
    model: text('model').notNull().default('demo'),
    promptVersion: text('prompt_version').notNull().default('0'),
    schemaVersion: text('schema_version').notNull().default('0'),
    /** Idempotency key (the generating job id). */
    generationKey: text('generation_key'),
    sourceSections: jsonb('source_sections').notNull().$type<unknown>(),
    /** Token usage / counts for future cost control (never invented). */
    metrics: jsonb('metrics').$type<Record<string, number | string>>(),
    createdAt: createdAt(),
  },
  (t) => ({
    meetingIdx: index('ai_packs_meeting_idx').on(t.meetingId),
    currentIdx: uniqueIndex('ai_packs_current_idx')
      .on(t.meetingId)
      .where(sql`${t.isCurrent}`),
    genKeyIdx: uniqueIndex('ai_packs_generation_key_idx')
      .on(t.meetingId, t.generationKey)
      .where(sql`${t.generationKey} is not null`),
  }),
);

export const exportPresets = pgTable('export_presets', {
  id: id(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  basePreset: text('base_preset').$type<PresetId>().notNull().default('ai'),
  size: text('size').$type<PackSize>().notNull().default('standard'),
  format: text('format').$type<ExportFormat>().notNull().default('md'),
  sections: jsonb('sections').notNull().$type<Record<string, boolean>>(),
  includeTimestamps: boolean('include_timestamps').notNull().default(true),
  includeSpeakers: boolean('include_speakers').notNull().default(true),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: createdAt(),
});

export const exportHistory = pgTable('export_history', {
  id: id(),
  meetingId: text('meeting_id').notNull(),
  workspaceId: text('workspace_id').notNull(),
  userId: text('user_id').notNull(),
  meetingTitle: text('meeting_title').notNull(),
  action: text('action').$type<'copied' | 'downloaded'>().notNull(),
  preset: text('preset').notNull(),
  size: text('size').$type<PackSize>().notNull(),
  format: text('format').$type<ExportFormat>().notNull(),
  language: text('language').notNull(),
  filename: text('filename'),
  bytes: integer('bytes').notNull().default(0),
  at: createdAt(),
});

export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  general: jsonb('general').notNull().$type<unknown>(),
  recording: jsonb('recording').notNull().$type<unknown>(),
  export: jsonb('export').notNull().$type<unknown>(),
  language: jsonb('language').notNull().$type<unknown>(),
  privacy: jsonb('privacy').notNull().$type<unknown>(),
  appearance: jsonb('appearance').notNull().$type<unknown>(),
  updatedAt: updatedAt(),
});

export const processingJobs = pgTable(
  'processing_jobs',
  {
    id: id(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    meetingId: text('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    mediaAssetId: text('media_asset_id'),
    type: text('type').$type<ProcessingJobType>().notNull(),
    status: text('status').$type<ProcessingJobStatus>().notNull().default('queued'),
    stage: text('stage').$type<ProcessingStage>().notNull().default('received'),
    progress: integer('progress').notNull().default(0),
    attempt: integer('attempt').notNull().default(1),
    maxAttempts: integer('max_attempts').notNull().default(3),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    /** Provider metadata for debugging/audit (never the meeting content). */
    provider: text('provider'),
    providerRequestId: text('provider_request_id'),
    model: text('model'),
    metrics: jsonb('metrics').$type<Record<string, number | string>>(),
    createdAt: createdAt(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (t) => ({ meetingIdx: index('jobs_meeting_idx').on(t.meetingId) }),
);
