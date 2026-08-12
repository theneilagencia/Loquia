import {
  err,
  ok,
  type AccessRequest,
  type AIPack,
  type ExportConfig,
  type Invitation,
  type Meeting,
  type OnboardingState,
  type ProcessingJob,
  type ExportResult,
  type Result,
  type Session,
  type Settings,
  type Transcript,
} from '@loquia/domain';
import { runExport, type ExportInput } from '@loquia/export-engine';
import type {
  BrowserStorageAdapter,
  ClipboardAdapter,
  DownloadAdapter,
  Services,
} from '@loquia/contracts';
import { ApiHttpError, createApiClient, type ApiClient } from './client';
import { resolvePack, type PackSource } from '../mock/pack-source';

export interface ApiDeps {
  clipboard: ClipboardAdapter;
  download: DownloadAdapter;
  storage: BrowserStorageAdapter;
}

function durationString(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

/** ApiAdapter — implements the same Services contract as MockAdapter over HTTP. */
export function createApiServices(deps: ApiDeps): Services {
  const api: ApiClient = createApiClient();
  const { storage } = deps;

  async function buildExportInput(config: ExportConfig): Promise<ExportInput | null> {
    const meeting = await api.get<Meeting | null>(`/api/meetings/${config.meetingId}`).catch(() => null);
    const packRes = await api
      .get<{ source: PackSource | null }>(`/api/meetings/${config.meetingId}/aipack`)
      .catch(() => ({ source: null }));
    const transcript = await api
      .get<Transcript | null>(`/api/meetings/${config.meetingId}/transcript`)
      .catch(() => null);
    if (!meeting || !packRes.source || !transcript) return null;

    const outputLanguage =
      config.outputLanguage === 'preserve' ? meeting.meetingLanguage : config.outputLanguage;
    const pt = outputLanguage.toLowerCase().startsWith('pt');
    const pack = resolvePack(packRes.source, outputLanguage);
    const participants = pack.sections.find((s) => s.key === 'participants')?.lines.map((l) => l.text) ?? [];
    const speakerName = (id: string) => {
      const sp = transcript.speakers.find((s) => s.id === id);
      return sp?.displayName?.trim() ? sp.displayName : (sp?.diarizationLabel ?? 'Speaker');
    };
    let date = meeting.createdAt;
    try {
      date = new Intl.DateTimeFormat(outputLanguage, { dateStyle: 'medium' }).format(new Date(meeting.createdAt));
    } catch {
      /* keep ISO */
    }
    return {
      meeting: {
        title: meeting.title,
        date,
        duration: durationString(meeting.durationSeconds),
        language: meeting.meetingLanguage,
        source: meeting.source === 'recording' ? (pt ? 'Gravação no navegador' : 'Browser recording') : pt ? 'Upload de arquivo' : 'File upload',
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

  return {
    auth: {
      async getSession() {
        const res = await api.get<{ session: Session | null }>('/api/auth/session').catch(() => ({ session: null }));
        return res.session;
      },
      async login(input) {
        try {
          const session = await api.post<Session>('/api/auth/login', input);
          return ok(session);
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: 'auth/invalid', message: 'auth.genericError' });
          throw e;
        }
      },
      async logout() {
        await api.post('/api/auth/logout').catch(() => undefined);
      },
      async forgotPassword() {
        // Password reset delivery is a later milestone — always resolve generically.
        return ok({ sent: true as const });
      },
      async getInvitationByToken(token) {
        const res = await api
          .get<{ invitation: Invitation | null }>(`/api/access/invitation/${encodeURIComponent(token)}`)
          .catch(() => ({ invitation: null }));
        return res.invitation;
      },
      async activateAccount(input) {
        try {
          const session = await api.post<Session>('/api/access/activate', input);
          return ok(session);
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: 'auth.activateInvalid' });
          throw e;
        }
      },
    },

    access: {
      async requestAccess(input) {
        try {
          const { id } = await api.post<{ id: string }>('/api/access/request', input);
          const now = new Date().toISOString();
          return ok({ id, ...input, status: 'pending', createdAt: now, updatedAt: now });
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message, fields: e.details as never });
          throw e;
        }
      },
      // Onboarding is a device-local concern in this milestone.
      async getOnboarding(userId) {
        const key = `onboarding:${userId}`;
        return (
          storage.get<OnboardingState>(key) ?? {
            userId,
            completed: false,
            currentStep: 0,
            totalSteps: 4,
            meetingLanguage: 'pt-BR',
          }
        );
      },
      async advanceOnboarding(userId, step) {
        const state = await this.getOnboarding(userId);
        const next = { ...state, currentStep: step };
        storage.set(`onboarding:${userId}`, next);
        return next;
      },
      async completeOnboarding(userId) {
        const state = await this.getOnboarding(userId);
        const next = { ...state, completed: true, currentStep: state.totalSteps, completedAt: new Date().toISOString() };
        storage.set(`onboarding:${userId}`, next);
        return next;
      },
    },

    admin: {
      listAccessRequests: (status) => api.get(`/api/admin/access-requests${status ? `?status=${status}` : ''}`),
      getAccessRequest: (id) => api.get<AccessRequest>(`/api/admin/access-requests/${id}`).catch(() => null),
      async approveAccessRequest(id) {
        try {
          return ok(await api.post<Invitation>(`/api/admin/access-requests/${id}/approve`));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      async rejectAccessRequest(id, _actorId, input) {
        try {
          return ok(await api.post(`/api/admin/access-requests/${id}/reject`, input));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      listInvitations: () => api.get('/api/admin/invitations'),
      async createInvitation(_actorId, input) {
        try {
          return ok(await api.post<Invitation>('/api/admin/invitations', input));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      async revokeInvitation(id) {
        try {
          return ok(await api.post<Invitation>(`/api/admin/invitations/${id}/revoke`));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      listUsers: () => api.get('/api/admin/users'),
      async setUserStatus(id, status) {
        try {
          return ok(await api.patch(`/api/admin/users/${id}/status`, { status }));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      async setUserRole(id, role) {
        try {
          return ok(await api.patch(`/api/admin/users/${id}/role`, { role }));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      listWorkspaces: () => api.get('/api/admin/workspaces'),
      async archiveWorkspace(id) {
        try {
          return ok(await api.post(`/api/admin/workspaces/${id}/archive`));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      listAudit: (page = 1, pageSize = 20) => api.get(`/api/admin/audit?page=${page}&pageSize=${pageSize}`),
      overview: () => api.get('/api/admin/overview'),
    },

    meetings: {
      list: (_workspaceId, includeArchived) => api.get(`/api/meetings?includeArchived=${includeArchived ? 'true' : 'false'}`),
      get: (id) => api.get<Meeting>(`/api/meetings/${id}`).catch(() => null),
      create: (input) =>
        api.post('/api/meetings', {
          title: input.title,
          source: input.source,
          meetingLanguage: input.meetingLanguage,
          durationSeconds: input.durationSeconds,
          recording: input.recording,
        }),
      async archive(id) {
        try {
          return ok(await api.post<Meeting>(`/api/meetings/${id}/archive`));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      async unarchive(id) {
        try {
          return ok(await api.post<Meeting>(`/api/meetings/${id}/unarchive`));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      getProcessingJob: (meetingId) => api.get<ProcessingJob | null>(`/api/meetings/${meetingId}/job`).catch(() => null),
      // In API mode the worker advances the job; the UI polls (never drives it).
      tickProcessing: (meetingId) => api.get<ProcessingJob | null>(`/api/meetings/${meetingId}/job`).catch(() => null),
      async retryProcessing(meetingId) {
        try {
          return ok(await api.post<ProcessingJob>(`/api/meetings/${meetingId}/job/retry`));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      async getAIPack(meetingId, outputLanguage): Promise<AIPack | null> {
        const res = await api.get<{ source: PackSource | null }>(`/api/meetings/${meetingId}/aipack`).catch(() => ({ source: null }));
        return res.source ? resolvePack(res.source, outputLanguage) : null;
      },
      getAIPackStatus: (meetingId) =>
        api
          .get<import('@loquia/contracts').AIPackStatusInfo>(`/api/meetings/${meetingId}/ai-pack/status`)
          .catch(() => ({ status: 'not_started' as const, hasCurrent: false, version: null, provider: null, model: null, generatedAt: null })),
      async generateAIPack(meetingId) {
        try {
          return ok(await api.post<ProcessingJob>(`/api/meetings/${meetingId}/ai-pack/generate`));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      async regenerateAIPack(meetingId) {
        try {
          return ok(await api.post<ProcessingJob>(`/api/meetings/${meetingId}/ai-pack/regenerate`));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
    },

    transcripts: {
      get: (meetingId) => api.get<Transcript>(`/api/meetings/${meetingId}/transcript`).catch(() => null),
      async updateSegmentText(meetingId, segmentId, text) {
        try {
          return ok(await api.patch(`/api/meetings/${meetingId}/segments/${segmentId}`, { text }));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      async renameSpeaker(meetingId, speakerId, displayName) {
        try {
          const res = await api.post<{ id: string; displayName?: string }>(`/api/meetings/${meetingId}/speakers/${speakerId}/rename`, { displayName });
          return ok({ id: res.id, diarizationLabel: res.id, displayName: res.displayName, color: '#5B4AE6' });
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      addMarker: (meetingId, marker) => api.post(`/api/meetings/${meetingId}/markers`, marker),
      search: (meetingId, query) => api.get(`/api/meetings/${meetingId}/transcript/search?q=${encodeURIComponent(query)}`),
    },

    exports: {
      async render(config): Promise<Result<ExportResult>> {
        const input = await buildExportInput(config);
        if (!input) return err({ code: 'not_ready', message: 'aiPack.empty' });
        return ok(runExport(input, config));
      },
      async download(config) {
        const rendered = await this.render(config);
        if (!rendered.ok) return rendered;
        deps.download.download(rendered.value.filename, rendered.value.content, rendered.value.mimeType);
        await api
          .post(`/api/meetings/${config.meetingId}/exports`, {
            action: 'downloaded',
            preset: config.preset,
            size: config.size,
            format: config.format,
            language: config.outputLanguage,
            filename: rendered.value.filename,
            bytes: rendered.value.bytes,
          })
          .catch(() => undefined);
        return rendered;
      },
      async copyToClipboard(config) {
        const rendered = await this.render(config);
        if (!rendered.ok) return rendered;
        await deps.clipboard.writeText(rendered.value.content);
        await api
          .post(`/api/meetings/${config.meetingId}/exports`, {
            action: 'copied',
            preset: config.preset,
            size: config.size,
            format: config.format,
            language: config.outputLanguage,
            filename: rendered.value.filename,
            bytes: rendered.value.bytes,
          })
          .catch(() => undefined);
        return rendered;
      },
      history: (meetingId) => (meetingId ? api.get(`/api/meetings/${meetingId}/exports`) : Promise.resolve([])),
    },

    settings: {
      get: () => api.get<Settings>('/api/settings'),
      update: (_userId, patch) => api.patch<Settings>('/api/settings', patch),
    },

    media: {
      async uploadIntent(input) {
        try {
          return ok(await api.post<import('@loquia/contracts').UploadIntent>('/api/meetings/upload-intent', input));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      async completeUpload(mediaAssetId) {
        try {
          return ok(await api.post<ProcessingJob>(`/api/media/${mediaAssetId}/complete`));
        } catch (e) {
          if (e instanceof ApiHttpError) return err({ code: e.code, message: e.message });
          throw e;
        }
      },
      async getAudioUrl(meetingId) {
        const res = await api.get<{ url: string | null }>(`/api/meetings/${meetingId}/audio-url`).catch(() => ({ url: null }));
        return res.url;
      },
    },

    storage: {
      async reset() {
        // Server state is authoritative in API mode; nothing to reset client-side.
      },
      async snapshot() {
        return {};
      },
    },
  };
}
