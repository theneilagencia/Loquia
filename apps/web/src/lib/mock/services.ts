import {
  err,
  nextStage,
  ok,
  stageProgress,
  type AccessRequest,
  type AuditAction,
  type AuditEvent,
  type ExportConfig,
  type ExportHistoryEntry,
  type ExportResult,
  type Id,
  type Invitation,
  type Marker,
  type Meeting,
  type ProcessingJob,
  type Result,
  type Session,
  type Settings,
  type Speaker,
  type Transcript,
  type TranscriptSegment,
  type User,
} from '@loquia/domain';
import type {
  AdminOverview,
  ClipboardAdapter,
  CreateMeetingInput,
  DeepPartial,
  DownloadAdapter,
  InviteUserInput,
  RejectAccessInput,
  RequestAccessInput,
  Services,
} from '@loquia/contracts';
import { runExport, type ExportInput } from '@loquia/export-engine';
import { MockStore } from './db';
import { newId, nowIso } from './id';
import { generateDemoContent } from './generate';
import { resolvePack } from './pack-source';
import type { MockDB } from './seed';

export interface MockDeps {
  store: MockStore;
  clipboard: ClipboardAdapter;
  download: DownloadAdapter;
}

/** Small artificial latency to mimic async services (0 in tests). */
const LATENCY = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 120;
const delay = (ms = LATENCY) => new Promise<void>((r) => setTimeout(r, ms));

function logAudit(
  store: MockStore,
  action: AuditAction,
  actor: { id: Id; label: string },
  target: { type: AuditEvent['targetType']; id: Id; label: string },
  metadata?: Record<string, string>,
): void {
  store.write((db) => {
    db.audit.unshift({
      id: newId('au'),
      action,
      actorId: actor.id,
      actorLabel: actor.label,
      targetType: target.type,
      targetId: target.id,
      targetLabel: target.label,
      metadata,
      createdAt: nowIso(),
    });
  });
}

export function createMockServices(deps: MockDeps): Services {
  const { store, clipboard, download } = deps;

  function currentActor(): { id: Id; label: string } {
    const db = store.read();
    const user = db.users.find((u) => u.id === db.session?.userId);
    return { id: user?.id ?? 'system', label: user?.name ?? 'System' };
  }

  return {
    // ---------------------------------------------------------------- Auth
    auth: {
      async getSession(): Promise<Session | null> {
        const db = store.read();
        if (!db.session) return null;
        const user = db.users.find((u) => u.id === db.session?.userId);
        if (!user) return null;
        const workspace = db.workspaces.find((w) => w.id === user.workspaceId);
        if (!workspace) return null;
        return { user, workspace, isAdmin: user.role !== 'member' };
      },
      async login(input) {
        await delay();
        const db = store.read();
        const user = db.users.find(
          (u) => u.email.toLowerCase() === input.email.toLowerCase(),
        );
        // Generic message on failure (task spec §20): never reveal which part failed.
        if (!user || user.status === 'suspended') {
          return err({ code: 'auth/invalid', message: 'auth.genericError' });
        }
        store.write((d) => {
          d.session = { userId: user.id };
        });
        const workspace = db.workspaces.find((w) => w.id === user.workspaceId)!;
        return ok<Session>({ user, workspace, isAdmin: user.role !== 'member' });
      },
      async logout() {
        store.write((db) => {
          db.session = null;
        });
      },
      async forgotPassword() {
        await delay();
        // Always succeed generically — never disclose whether the email exists.
        return ok({ sent: true as const });
      },
      async getInvitationByToken(token) {
        const db = store.read();
        return db.invitations.find((i) => i.token === token) ?? null;
      },
      async activateAccount(input) {
        await delay();
        const db = store.read();
        const invitation = db.invitations.find((i) => i.token === input.token);
        if (!invitation || invitation.status !== 'sent') {
          return err({ code: 'auth/invalid_token', message: 'auth.activateInvalid' });
        }
        const now = nowIso();
        const user: User = {
          id: newId('u'),
          email: invitation.email,
          name: input.name,
          role: invitation.role,
          status: 'active',
          workspaceId: invitation.workspaceId,
          locale: 'pt-BR',
          createdAt: now,
          updatedAt: now,
          lastActiveAt: now,
        };
        store.write((d) => {
          d.users.push(user);
          const inv = d.invitations.find((i) => i.id === invitation.id);
          if (inv) {
            inv.status = 'accepted';
            inv.acceptedAt = now;
          }
          d.onboarding.push({
            userId: user.id,
            completed: false,
            currentStep: 0,
            totalSteps: 3,
            meetingLanguage: 'pt-BR',
          });
          d.session = { userId: user.id };
        });
        logAudit(store, 'invitation.accepted', { id: user.id, label: user.name }, { type: 'invitation', id: invitation.id, label: invitation.email });
        logAudit(store, 'user.activated', { id: user.id, label: user.name }, { type: 'user', id: user.id, label: user.email });
        const workspace = db.workspaces.find((w) => w.id === user.workspaceId)!;
        return ok<Session>({ user, workspace, isAdmin: user.role !== 'member' });
      },
    },

    // -------------------------------------------------------------- Access
    access: {
      async requestAccess(input: RequestAccessInput) {
        await delay();
        const now = nowIso();
        const request: AccessRequest = {
          id: newId('ar'),
          ...input,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        };
        store.write((db) => {
          db.accessRequests.unshift(request);
        });
        logAudit(store, 'access_request.created', { id: request.id, label: request.name }, { type: 'access_request', id: request.id, label: request.email });
        return ok(request);
      },
      async getOnboarding(userId) {
        const db = store.read();
        const existing = db.onboarding.find((o) => o.userId === userId);
        if (existing) return existing;
        const created = {
          userId,
          completed: false,
          currentStep: 0,
          totalSteps: 3,
          meetingLanguage: 'pt-BR',
        };
        store.write((d) => d.onboarding.push(created));
        return created;
      },
      async advanceOnboarding(userId, step) {
        return store.write((db) => {
          const o = db.onboarding.find((x) => x.userId === userId);
          if (!o) throw new Error('onboarding not found');
          o.currentStep = step;
          return o;
        });
      },
      async completeOnboarding(userId) {
        return store.write((db) => {
          const o = db.onboarding.find((x) => x.userId === userId);
          if (!o) throw new Error('onboarding not found');
          o.completed = true;
          o.currentStep = o.totalSteps;
          o.completedAt = nowIso();
          return o;
        });
      },
    },

    // --------------------------------------------------------------- Admin
    admin: {
      async listAccessRequests(status) {
        const db = store.read();
        return db.accessRequests.filter((r) => (status ? r.status === status : true));
      },
      async getAccessRequest(id) {
        return store.read().accessRequests.find((r) => r.id === id) ?? null;
      },
      async approveAccessRequest(id, actorId) {
        await delay();
        const db = store.read();
        const request = db.accessRequests.find((r) => r.id === id);
        if (!request) return err({ code: 'not_found', message: 'errors.notFoundBody' });
        if (request.status !== 'pending') {
          return err({ code: 'invalid_state', message: 'errors.genericBody' });
        }
        const actor = db.users.find((u) => u.id === actorId);
        const now = nowIso();
        const invitation: Invitation = {
          id: newId('inv'),
          email: request.email,
          workspaceId: actor?.workspaceId ?? 'w1',
          role: 'member',
          token: newId('tok'),
          status: 'sent',
          accessRequestId: request.id,
          invitedByUserId: actorId,
          createdAt: now,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        };
        store.write((d) => {
          const r = d.accessRequests.find((x) => x.id === id)!;
          r.status = 'approved';
          r.reviewedByUserId = actorId;
          r.reviewedAt = now;
          r.invitationId = invitation.id;
          r.updatedAt = now;
          d.invitations.unshift(invitation);
        });
        logAudit(store, 'access_request.approved', { id: actorId, label: actor?.name ?? 'Admin' }, { type: 'access_request', id: request.id, label: request.email });
        logAudit(store, 'invitation.sent', { id: actorId, label: actor?.name ?? 'Admin' }, { type: 'invitation', id: invitation.id, label: invitation.email });
        return ok(invitation);
      },
      async rejectAccessRequest(id, actorId, input: RejectAccessInput) {
        await delay();
        const db = store.read();
        const request = db.accessRequests.find((r) => r.id === id);
        if (!request) return err({ code: 'not_found', message: 'errors.notFoundBody' });
        const actor = db.users.find((u) => u.id === actorId);
        const now = nowIso();
        const updated = store.write((d) => {
          const r = d.accessRequests.find((x) => x.id === id)!;
          r.status = 'rejected';
          r.reviewedByUserId = actorId;
          r.reviewedAt = now;
          r.rejectionReason = input.reason;
          r.updatedAt = now;
          return r;
        });
        logAudit(store, 'access_request.rejected', { id: actorId, label: actor?.name ?? 'Admin' }, { type: 'access_request', id: request.id, label: request.email });
        return ok(updated);
      },
      async listInvitations() {
        return store.read().invitations;
      },
      async createInvitation(actorId, input: InviteUserInput) {
        await delay();
        const db = store.read();
        const actor = db.users.find((u) => u.id === actorId);
        const now = nowIso();
        const invitation: Invitation = {
          id: newId('inv'),
          email: input.email,
          workspaceId: actor?.workspaceId ?? 'w1',
          role: input.role,
          token: newId('tok'),
          status: 'sent',
          invitedByUserId: actorId,
          createdAt: now,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        };
        store.write((d) => d.invitations.unshift(invitation));
        logAudit(store, 'invitation.sent', { id: actorId, label: actor?.name ?? 'Admin' }, { type: 'invitation', id: invitation.id, label: invitation.email });
        return ok(invitation);
      },
      async revokeInvitation(id, actorId) {
        const db = store.read();
        const actor = db.users.find((u) => u.id === actorId);
        const invitation = db.invitations.find((i) => i.id === id);
        if (!invitation) return err({ code: 'not_found', message: 'errors.notFoundBody' });
        const updated = store.write((d) => {
          const inv = d.invitations.find((i) => i.id === id)!;
          inv.status = 'revoked';
          return inv;
        });
        logAudit(store, 'invitation.revoked', { id: actorId, label: actor?.name ?? 'Admin' }, { type: 'invitation', id: invitation.id, label: invitation.email });
        return ok(updated);
      },
      async listUsers() {
        return store.read().users;
      },
      async setUserStatus(id, status, actorId) {
        const db = store.read();
        const actor = db.users.find((u) => u.id === actorId);
        const target = db.users.find((u) => u.id === id);
        if (!target) return err({ code: 'not_found', message: 'errors.notFoundBody' });
        const updated = store.write((d) => {
          const u = d.users.find((x) => x.id === id)!;
          u.status = status;
          u.updatedAt = nowIso();
          return u;
        });
        logAudit(store, 'user.suspended', { id: actorId, label: actor?.name ?? 'Admin' }, { type: 'user', id: target.id, label: target.email }, { status });
        return ok(updated);
      },
      async setUserRole(id, role, actorId) {
        const db = store.read();
        const actor = db.users.find((u) => u.id === actorId);
        const target = db.users.find((u) => u.id === id);
        if (!target) return err({ code: 'not_found', message: 'errors.notFoundBody' });
        const updated = store.write((d) => {
          const u = d.users.find((x) => x.id === id)!;
          u.role = role;
          u.updatedAt = nowIso();
          return u;
        });
        logAudit(store, 'user.role_changed', { id: actorId, label: actor?.name ?? 'Admin' }, { type: 'user', id: target.id, label: target.email }, { role });
        return ok(updated);
      },
      async listWorkspaces() {
        return store.read().workspaces;
      },
      async archiveWorkspace(id, actorId) {
        const db = store.read();
        const actor = db.users.find((u) => u.id === actorId);
        const ws = db.workspaces.find((w) => w.id === id);
        if (!ws) return err({ code: 'not_found', message: 'errors.notFoundBody' });
        const updated = store.write((d) => {
          const w = d.workspaces.find((x) => x.id === id)!;
          w.archived = true;
          w.updatedAt = nowIso();
          return w;
        });
        logAudit(store, 'workspace.archived', { id: actorId, label: actor?.name ?? 'Admin' }, { type: 'workspace', id: ws.id, label: ws.name });
        return ok(updated);
      },
      async listAudit(page = 1, pageSize = 20) {
        const db = store.read();
        const start = (page - 1) * pageSize;
        return {
          items: db.audit.slice(start, start + pageSize),
          total: db.audit.length,
          page,
          pageSize,
        };
      },
      async overview(): Promise<AdminOverview> {
        const db = store.read();
        return {
          pendingRequests: db.accessRequests.filter((r) => r.status === 'pending').length,
          activeUsers: db.users.filter((u) => u.status === 'active').length,
          workspaces: db.workspaces.filter((w) => !w.archived).length,
          meetingsLast30Days: db.meetings.length,
          openInvitations: db.invitations.filter((i) => i.status === 'sent').length,
        };
      },
    },

    // ------------------------------------------------------------ Meetings
    meetings: {
      async list(workspaceId, includeArchived = false) {
        const db = store.read();
        return db.meetings
          .filter((m) => m.workspaceId === workspaceId)
          .filter((m) => (includeArchived ? true : m.status !== 'archived'))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },
      async get(id) {
        return store.read().meetings.find((m) => m.id === id) ?? null;
      },
      async create(input: CreateMeetingInput) {
        await delay();
        const now = nowIso();
        const meetingId = newId('m');
        const meeting: Meeting = {
          id: meetingId,
          workspaceId: input.workspaceId,
          ownerId: input.ownerId,
          title: input.title,
          source: input.source,
          status: 'processing',
          meetingLanguage: input.meetingLanguage,
          durationSeconds: input.durationSeconds,
          participantCount: 2,
          createdAt: now,
          updatedAt: now,
        };
        store.write((db) => {
          db.meetings.unshift(meeting);
          if (input.recording) {
            const recordingId = newId('r');
            db.recordings.push({
              id: recordingId,
              meetingId,
              createdAt: now,
              ...input.recording,
            });
            meeting.recordingId = recordingId;
          }
          db.jobs.push({
            id: newId('j'),
            workspaceId: input.workspaceId,
            meetingId,
            type: 'media_processing',
            status: 'queued',
            stage: 'received',
            progress: 0,
            attempt: 1,
            maxAttempts: 3,
            createdAt: now,
            updatedAt: now,
          });
        });
        logAudit(store, 'meeting.created', currentActor(), { type: 'meeting', id: meetingId, label: meeting.title });
        return meeting;
      },
      async archive(id) {
        const db = store.read();
        if (!db.meetings.find((m) => m.id === id)) {
          return err({ code: 'not_found', message: 'errors.notFoundBody' });
        }
        const updated = store.write((d) => {
          const m = d.meetings.find((x) => x.id === id)!;
          m.status = 'archived';
          m.archivedAt = nowIso();
          m.updatedAt = nowIso();
          return m;
        });
        return ok(updated);
      },
      async unarchive(id) {
        const db = store.read();
        if (!db.meetings.find((m) => m.id === id)) {
          return err({ code: 'not_found', message: 'errors.notFoundBody' });
        }
        const updated = store.write((d) => {
          const m = d.meetings.find((x) => x.id === id)!;
          m.status = d.packSources.some((p) => p.meetingId === id) ? 'ready' : 'draft';
          m.archivedAt = undefined;
          m.updatedAt = nowIso();
          return m;
        });
        return ok(updated);
      },
      async getProcessingJob(meetingId) {
        const db = store.read();
        return (
          db.jobs
            .filter((j) => j.meetingId === meetingId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
        );
      },
      async tickProcessing(meetingId) {
        const db = store.read();
        const job = db.jobs
          .filter((j) => j.meetingId === meetingId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        if (!job) return null;
        if (job.status === 'completed' || job.status === 'failed') return job;

        const upcoming = nextStage(job.stage);
        return store.write((d) => {
          const j = d.jobs.find((x) => x.id === job.id)!;
          const m = d.meetings.find((x) => x.id === meetingId);
          j.status = 'running';
          j.startedAt = j.startedAt ?? nowIso();
          j.updatedAt = nowIso();
          if (upcoming) {
            j.stage = upcoming;
            j.progress = stageProgress(upcoming);
            if (upcoming === 'ready_for_ai_pack') {
              j.status = 'completed';
              j.progress = 100;
              j.completedAt = nowIso();
              if (m) {
                m.status = 'ready';
                m.updatedAt = nowIso();
              }
              if (!d.transcripts.some((t) => t.meetingId === meetingId)) {
                const { transcript, packSource } = generateDemoContent(
                  meetingId,
                  m?.meetingLanguage ?? 'pt-BR',
                );
                d.transcripts.push(transcript);
                d.packSources.push(packSource);
              }
            }
          } else {
            j.stage = 'ready_for_ai_pack';
            j.progress = 100;
            j.status = 'completed';
          }
          return j;
        });
      },
      async retryProcessing(meetingId) {
        const db = store.read();
        const job = db.jobs
          .filter((j) => j.meetingId === meetingId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        if (!job) return err({ code: 'not_found', message: 'errors.notFoundBody' });
        const updated = store.write((d) => {
          const j = d.jobs.find((x) => x.id === job.id)!;
          const m = d.meetings.find((x) => x.id === meetingId);
          j.status = 'queued';
          j.stage = 'received';
          j.progress = 0;
          j.attempt = 1;
          j.errorCode = undefined;
          j.errorMessage = undefined;
          j.startedAt = undefined;
          j.completedAt = undefined;
          j.updatedAt = nowIso();
          if (m) {
            m.status = 'processing';
            m.updatedAt = nowIso();
          }
          return j;
        });
        return ok(updated);
      },
      async getAIPack(meetingId, outputLanguage) {
        const source = store.read().packSources.find((p) => p.meetingId === meetingId);
        return source ? resolvePack(source, outputLanguage) : null;
      },
      async getAIPackStatus(meetingId) {
        const db = store.read();
        const hasCurrent = db.packSources.some((p) => p.meetingId === meetingId);
        return {
          status: hasCurrent ? ('ready' as const) : ('not_started' as const),
          hasCurrent,
          version: hasCurrent ? 1 : null,
          provider: hasCurrent ? 'mock' : null,
          model: hasCurrent ? 'mock-aipack-1' : null,
          generatedAt: hasCurrent ? nowIso() : null,
        };
      },
      async generateAIPack(meetingId) {
        return this_regenerate(store, meetingId);
      },
      async regenerateAIPack(meetingId) {
        return this_regenerate(store, meetingId);
      },
    },

    // ---------------------------------------------------------- Transcript
    transcripts: {
      async get(meetingId) {
        return store.read().transcripts.find((t) => t.meetingId === meetingId) ?? null;
      },
      async updateSegmentText(meetingId, segmentId, text) {
        const db = store.read();
        const transcript = db.transcripts.find((t) => t.meetingId === meetingId);
        const segment = transcript?.segments.find((s) => s.id === segmentId);
        if (!transcript || !segment) {
          return err({ code: 'not_found', message: 'errors.notFoundBody' });
        }
        const updated = store.write((d) => {
          const t = d.transcripts.find((x) => x.meetingId === meetingId)!;
          const s = t.segments.find((x) => x.id === segmentId)!;
          s.text = text;
          s.edited = true;
          t.updatedAt = nowIso();
          return s;
        });
        return ok<TranscriptSegment>(updated);
      },
      async renameSpeaker(meetingId, speakerId, displayName) {
        const db = store.read();
        const transcript = db.transcripts.find((t) => t.meetingId === meetingId);
        const speaker = transcript?.speakers.find((s) => s.id === speakerId);
        if (!transcript || !speaker) {
          return err({ code: 'not_found', message: 'errors.notFoundBody' });
        }
        // Rename propagates because AI Pack/export resolve names via speakerId
        // at render time — there is a single source of truth for the name.
        const updated = store.write((d) => {
          const t = d.transcripts.find((x) => x.meetingId === meetingId)!;
          const sp = t.speakers.find((x) => x.id === speakerId)!;
          sp.displayName = displayName.trim() || undefined;
          t.updatedAt = nowIso();
          return sp;
        });
        return ok<Speaker>(updated);
      },
      async addMarker(meetingId, marker: Omit<Marker, 'id' | 'createdAt'>) {
        const created: Marker = { ...marker, id: newId('mk'), createdAt: nowIso() };
        store.write((d) => d.markers.push({ ...created, meetingId }));
        return created;
      },
      async search(meetingId, query) {
        const db = store.read();
        const transcript = db.transcripts.find((t) => t.meetingId === meetingId);
        if (!transcript || !query.trim()) return [];
        const q = query.toLowerCase();
        return transcript.segments.filter((s) => s.text.toLowerCase().includes(q));
      },
    },

    // ------------------------------------------------------------- Exports
    exports: {
      async render(config: ExportConfig): Promise<Result<ExportResult>> {
        const input = buildExportInput(store.read(), config);
        if (!input) return err({ code: 'not_ready', message: 'aiPack.empty' });
        return ok(runExport(input, config));
      },
      async download(config) {
        const rendered = await this.render(config);
        if (!rendered.ok) return rendered;
        download.download(rendered.value.filename, rendered.value.content, rendered.value.mimeType);
        recordExport(store, config, rendered.value, 'downloaded');
        logAudit(store, 'export.created', currentActor(), { type: 'export', id: rendered.value.filename, label: rendered.value.filename });
        return rendered;
      },
      async copyToClipboard(config) {
        const rendered = await this.render(config);
        if (!rendered.ok) return rendered;
        await clipboard.writeText(rendered.value.content);
        recordExport(store, config, rendered.value, 'copied');
        return rendered;
      },
      async history(meetingId?: Id): Promise<ExportHistoryEntry[]> {
        const db = store.read();
        return db.exportHistory
          .filter((e) => (meetingId ? e.meetingId === meetingId : true))
          .sort((a, b) => b.at.localeCompare(a.at));
      },
    },

    // ------------------------------------------------------------ Settings
    settings: {
      async get(userId): Promise<Settings> {
        const db = store.read();
        const found = db.settings.find((s) => s.userId === userId);
        if (found) return found;
        const created = db.settings[0];
        if (created) return { ...created, userId };
        throw new Error('settings not found');
      },
      async update(userId, patch: DeepPartial<Settings>) {
        return store.write((db) => {
          let current = db.settings.find((s) => s.userId === userId);
          if (!current) {
            current = { ...(db.settings[0] as Settings), userId };
            db.settings.push(current);
          }
          const merged = deepMerge(current, patch) as Settings;
          const idx = db.settings.findIndex((s) => s.userId === userId);
          db.settings[idx] = merged;
          return merged;
        });
      },
    },

    // --------------------------------------------------------------- Media
    // Mock media flow: no real object storage. uploadIntent creates the meeting
    // + queued job (mediaAssetId == meetingId) and returns an empty uploadUrl so
    // the shared UI skips the direct PUT; the mock pipeline advances via tick.
    media: {
      async uploadIntent(input) {
        const db = store.read();
        const user = db.users.find((u) => u.id === db.session?.userId);
        const meeting = this_meetingsCreate(store, {
          workspaceId: user?.workspaceId ?? 'w1',
          ownerId: user?.id ?? 'u1',
          title: input.title,
          source: input.source,
          meetingLanguage: input.meetingLanguage,
          durationSeconds: 0,
        });
        return ok({
          meetingId: meeting.id,
          mediaAssetId: meeting.id,
          uploadUrl: '',
          requiredHeaders: {},
          expiresAt: new Date(Date.now() + 900_000).toISOString(),
        });
      },
      async completeUpload(mediaAssetId) {
        const db = store.read();
        const job = db.jobs
          .filter((j) => j.meetingId === mediaAssetId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        if (!job) return err({ code: 'not_found', message: 'errors.notFoundBody' });
        return ok(job);
      },
      async getAudioUrl(meetingId) {
        const db = store.read();
        const meeting = db.meetings.find((m) => m.id === meetingId);
        return meeting?.recordingId ? `mock-audio://${meetingId}` : null;
      },
    },

    // ------------------------------------------------------------- Storage
    storage: {
      async reset() {
        store.reset();
      },
      async snapshot() {
        return store.snapshot() as unknown as Record<string, unknown>;
      },
    },
  };
}

/** Shared meeting-creation used by meetings.create and media.uploadIntent. */
/** Mock AI Pack (re)generation: (re)build the demo pack source for a meeting. */
function this_regenerate(store: MockStore, meetingId: Id): Result<ProcessingJob> {
  const db = store.read();
  const meeting = db.meetings.find((m) => m.id === meetingId);
  if (!meeting) return err({ code: 'not_found', message: 'errors.notFoundBody' });
  const { transcript, packSource } = generateDemoContent(meetingId, meeting.meetingLanguage);
  store.write((d) => {
    d.packSources = d.packSources.filter((p) => p.meetingId !== meetingId);
    d.packSources.push(packSource);
    if (!d.transcripts.some((t) => t.meetingId === meetingId)) d.transcripts.push(transcript);
  });
  const now = nowIso();
  const job: ProcessingJob = {
    id: newId('j'),
    workspaceId: meeting.workspaceId,
    meetingId,
    type: 'ai_pack',
    status: 'completed',
    stage: 'ready_for_ai_pack',
    progress: 100,
    attempt: 1,
    maxAttempts: 3,
    createdAt: now,
    updatedAt: now,
    completedAt: now,
  };
  return ok(job);
}

function this_meetingsCreate(store: MockStore, input: CreateMeetingInput): Meeting {
  const now = nowIso();
  const meetingId = newId('m');
  const meeting: Meeting = {
    id: meetingId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    title: input.title,
    source: input.source,
    status: 'processing',
    meetingLanguage: input.meetingLanguage,
    durationSeconds: input.durationSeconds,
    participantCount: 2,
    createdAt: now,
    updatedAt: now,
  };
  store.write((db) => {
    db.meetings.unshift(meeting);
    if (input.recording) {
      const recordingId = newId('r');
      db.recordings.push({ id: recordingId, meetingId, createdAt: now, ...input.recording });
      meeting.recordingId = recordingId;
    }
    db.jobs.push({
      id: newId('j'),
      workspaceId: input.workspaceId,
      meetingId,
      type: 'media_processing',
      status: 'queued',
      stage: 'received',
      progress: 0,
      attempt: 1,
      maxAttempts: 3,
      createdAt: now,
      updatedAt: now,
    });
  });
  return meeting;
}

function sourceLabel(source: Meeting['source'], pt: boolean): string {
  if (source === 'recording') return pt ? 'Gravação no navegador' : 'Browser recording';
  return pt ? 'Upload de arquivo' : 'File upload';
}

function durationString(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
}

/** Build the engine input from stored meeting/transcript/pack for a config. */
function buildExportInput(db: MockDB, config: ExportConfig): ExportInput | null {
  const meeting = db.meetings.find((m) => m.id === config.meetingId);
  const source = db.packSources.find((p) => p.meetingId === config.meetingId);
  const transcript: Transcript | undefined = db.transcripts.find(
    (t) => t.meetingId === config.meetingId,
  );
  if (!meeting || !source || !transcript) return null;

  const outputLanguage =
    config.outputLanguage === 'preserve' ? meeting.meetingLanguage : config.outputLanguage;
  const pt = outputLanguage.toLowerCase().startsWith('pt');
  const pack = resolvePack(source, outputLanguage);

  const participants =
    pack.sections.find((s) => s.key === 'participants')?.lines.map((l) => l.text) ?? [];

  const speakerName = (id: string) => {
    const sp = transcript.speakers.find((s) => s.id === id);
    return sp?.displayName?.trim() ? sp.displayName : (sp?.diarizationLabel ?? 'Speaker');
  };

  let date = meeting.createdAt;
  try {
    date = new Intl.DateTimeFormat(outputLanguage, { dateStyle: 'medium' }).format(
      new Date(meeting.createdAt),
    );
  } catch {
    /* keep ISO */
  }

  return {
    meeting: {
      title: meeting.title,
      date,
      duration: durationString(meeting.durationSeconds),
      language: meeting.meetingLanguage,
      source: sourceLabel(meeting.source, pt),
      status: meeting.status,
    },
    participants,
    pack,
    transcript: transcript.segments.map((seg) => ({
      stamp: durationString(seg.startSeconds),
      speaker: speakerName(seg.speakerId),
      text: seg.text,
      atSeconds: seg.startSeconds,
    })),
  };
}

function recordExport(
  store: MockStore,
  config: ExportConfig,
  result: ExportResult,
  action: 'downloaded' | 'copied',
): void {
  const db = store.read();
  const meeting = db.meetings.find((m) => m.id === config.meetingId);
  const outputLanguage =
    config.outputLanguage === 'preserve'
      ? (meeting?.meetingLanguage ?? 'pt-BR')
      : config.outputLanguage;
  store.write((d) => {
    d.exportHistory.unshift({
      id: newId('ex'),
      meetingId: config.meetingId,
      meetingTitle: meeting?.title ?? config.meetingId,
      at: nowIso(),
      action,
      preset: config.preset,
      size: config.size,
      format: config.format,
      language: outputLanguage,
      filename: result.filename,
      bytes: result.bytes,
    });
  });
}

function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  if (patch == null) return base;
  const output = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(patch as object)) {
    const patchValue = (patch as Record<string, unknown>)[key];
    const baseValue = (base as Record<string, unknown>)[key];
    if (
      patchValue &&
      typeof patchValue === 'object' &&
      !Array.isArray(patchValue) &&
      baseValue &&
      typeof baseValue === 'object'
    ) {
      output[key] = deepMerge(baseValue, patchValue as DeepPartial<unknown>);
    } else if (patchValue !== undefined) {
      output[key] = patchValue;
    }
  }
  return output as T;
}
