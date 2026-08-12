# Loquia — tipos de domínio (TypeScript)

Extraídos do protótipo validado. Datas em ISO 8601 (string).

```ts
export type Locale = "pt-BR" | "en-US" | "es-ES" | "es-MX" | "fr-FR" | "de-DE";
export type MeetingLanguage = Locale | "mixed";
export type ThemePref = "system" | "light" | "dark";

export type UserStatus = "pending_activation" | "active" | "suspended" | "deactivated";
export interface User {
  id: string; name: string; email: string; workspaceId: string;
  role: "owner" | "admin" | "member";
  status: UserStatus; locale: Locale;
  activatedAt: string | null; lastLoginAt: string | null;
}

export interface Workspace {
  id: string; name: string; ownerUserId: string; memberCount: number;
  status: "active" | "suspended"; defaultLocale: Locale;
  createdAt: string; lastActivityAt: string;
}

export type AccessRequestStatus =
  | "submitted" | "under_review" | "more_information_required"
  | "approved" | "rejected" | "cancelled" | "expired";
export interface AccessRequest {
  id: string; name: string; email: string; company: string; role: string;
  teamSize: string; meetingVolume: string; primaryAI: string;
  useCase: string; currentWorkflow: string; source: string;
  status: AccessRequestStatus; reviewerUserId: string | null;
  internalNotes: string; createdAt: string;
  history: Array<{ at: string; what: AuditEventType; by?: string }>;
}

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";
export interface Invitation {
  id: string; token: string; email: string; name: string;
  workspaceId: string; role: User["role"]; accessRequestId: string | null;
  status: InvitationStatus; createdAt: string; expiresAt: string;
}

export type AuditEventType =
  | "submitted" | "review_started" | "information_requested" | "approved" | "rejected"
  | "cancelled" | "reopened" | "invite_created" | "invite_prepared" | "invite_resent"
  | "invite_revoked" | "account_activated" | "user_suspended" | "user_reactivated"
  | "user_deactivated" | "workspace_suspended" | "workspace_reactivated"
  | "workspace_owner_changed" | "settings_changed" | "export_created";
export interface AuditEvent {
  id: string; at: string; type: AuditEventType;
  text: string; actorUserId: string; targetId?: string;
}

export type MeetingStatus = "recording" | "queued" | "transcribing" | "ready" | "partial" | "error" | "archived";
export interface Meeting {
  id: string; workspaceId: string; title: string;
  startedAt: string; durationSeconds: number;
  language: MeetingLanguage; source: "recording" | "upload";
  status: MeetingStatus;
  participants: Participant[];
  recording: Recording | null;
  transcript: TranscriptSegment[];
  markers: Marker[];
  speakerAliases: Record<string, string>;
  createdAt: string; updatedAt: string;
}

export interface Participant { id: string; name: string; organization: string | null; isExternal: boolean; }
export interface Recording { id: string; meetingId: string; mimeType: string; durationSeconds: number; sizeBytes: number; blobRef: string; quality: "small" | "standard" | "high"; }
export interface TranscriptSegment { id: string; meetingId: string; startSeconds: number; endSeconds: number; speakerKey: string; text: string; isKey?: boolean; confidence?: number; }
export interface Marker { id: string; meetingId: string; atSeconds: number; label: string; }
export interface Evidence { segmentId: string; atSeconds: number; speakerKey: string; excerpt: string; language: MeetingLanguage; }

export type PackSectionKey =
  | "instructions" | "metadata" | "participants" | "purpose" | "executiveContext"
  | "topics" | "importantStatements" | "explicitDecisions" | "openPoints"
  | "questions" | "numbersAndDates" | "ambiguities" | "evidence" | "transcript";
export interface AIPackSection { key: PackSectionKey; title: string; required: boolean; lines: Array<{ text: string; atSeconds?: number; confidence?: "explicit" | "uncertain" }>; }
export interface AIPack { meetingId: string; sections: AIPackSection[]; language: MeetingLanguage; }

export type PresetId = "ai" | "transcript" | "analysis" | "writing" | "full" | `custom:${string}`;
export type PackSize = "compact" | "standard" | "full";
export type ExportFormat = "md" | "txt" | "json";
export interface ExportPreset {
  id: string; name: string; description: string;
  basePreset: PresetId; size: PackSize; format: ExportFormat;
  sections: Record<"instructions" | "transcript" | "evidence" | "ambiguities", boolean>;
  includeTimestamps: boolean; includeSpeakers: boolean; isDefault: boolean;
}
export interface ExportConfig {
  meetingId: string; preset: PresetId; size: PackSize; format: ExportFormat;
  sections: ExportPreset["sections"]; outputLanguage: Locale | "preserve";
  writingGoal?: string;
}
export interface ExportHistoryEntry { id: string; meetingId: string; at: string; action: "copied" | "downloaded"; preset: string; size: string; format: ExportFormat; filename?: string; }

export interface UserSettings {
  name: string; workspaceName: string; timezone: string;
  defaultMeetingLanguage: MeetingLanguage;
  microphone: string; recordingQuality: Recording["quality"]; consentReminder: boolean; recordingLanguage: MeetingLanguage;
  defaultPreset: PresetId; defaultFormat: ExportFormat; defaultSize: PackSize;
  exportLanguage: Locale | "preserve";
  includeInstructions: boolean; includeTimestamps: boolean; includeTranscript: boolean;
  audioRetentionDays: 0 | 7 | 30 | 90; transcriptRetention: "forever" | 180 | 365;
  uiLocale: Locale; theme: ThemePref;
}
```
