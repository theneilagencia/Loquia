import { beforeEach, describe, expect, it } from 'vitest';
import { runExport } from '@loquia/export-engine';
import { createBrowserStorage } from '../adapters/browser-storage';
import { createClipboardAdapter } from '../adapters/clipboard';
import { createDownloadAdapter } from '../adapters/download';
import { MockStore } from './db';
import { createMockServices } from './services';

function freshServices() {
  const storage = createBrowserStorage(`test-${Math.random()}`);
  const store = new MockStore(storage);
  store.reset();
  const services = createMockServices({
    store,
    clipboard: { writeText: async () => {}, isSupported: () => true },
    download: { download: () => {} },
  });
  return { services, store };
}

describe('access workflow', () => {
  it('request → approve → invitation → activate creates a user + session', async () => {
    const { services } = freshServices();

    const req = await services.access.requestAccess({
      name: 'Test User',
      email: 'test@company.com',
      company: 'Company',
      role: 'PM',
      useCase: 'Testing the full access workflow end to end.',
      preferredLocale: 'pt-BR',
    });
    expect(req.ok).toBe(true);
    if (!req.ok) return;

    const approval = await services.admin.approveAccessRequest(req.value.id, 'u1');
    expect(approval.ok).toBe(true);
    if (!approval.ok) return;
    expect(approval.value.status).toBe('sent');

    const activated = await services.auth.activateAccount({
      token: approval.value.token,
      name: 'Test User',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(activated.ok).toBe(true);
    if (!activated.ok) return;
    expect(activated.value.user.email).toBe('test@company.com');
    expect(activated.value.user.status).toBe('active');
  });

  it('rejecting a request records the reason and blocks approval', async () => {
    const { services } = freshServices();
    const req = await services.access.requestAccess({
      name: 'Spam',
      email: 'spam@x.com',
      company: 'X',
      role: 'X',
      useCase: 'Not a real use case here.',
      preferredLocale: 'en-US',
    });
    if (!req.ok) return;
    const rejected = await services.admin.rejectAccessRequest(req.value.id, 'u1', {
      reason: 'Insufficient information',
    });
    expect(rejected.ok).toBe(true);
    const approveAfter = await services.admin.approveAccessRequest(req.value.id, 'u1');
    expect(approveAfter.ok).toBe(false);
  });
});

describe('admin workflow', () => {
  it('suspend then reactivate a user and change role, writing audit events', async () => {
    const { services } = freshServices();
    const suspended = await services.admin.setUserStatus('u2', 'suspended', 'u1');
    expect(suspended.ok && suspended.value.status).toBe('suspended');
    const admin = await services.admin.setUserRole('u2', 'admin', 'u1');
    expect(admin.ok && admin.value.role).toBe('admin');

    const audit = await services.admin.listAudit(1, 50);
    const actions = audit.items.map((e) => e.action);
    expect(actions).toContain('user.suspended');
    expect(actions).toContain('user.role_changed');
  });

  it('a suspended user cannot log in', async () => {
    const { services } = freshServices();
    await services.admin.setUserStatus('u1', 'suspended', 'u1');
    const login = await services.auth.login({ email: 'vinicius@apymine.com', password: 'x' });
    expect(login.ok).toBe(false);
  });
});

describe('processing pipeline', () => {
  it('ticks a queued job to ready and generates transcript + AI Pack', async () => {
    const { services } = freshServices();
    const session = await services.auth.getSession();
    if (!session) throw new Error('no session');
    const meeting = await services.meetings.create({
      workspaceId: session.workspace.id,
      ownerId: session.user.id,
      title: 'New meeting',
      source: 'upload',
      meetingLanguage: 'pt-BR',
      durationSeconds: 120,
    });
    let job = await services.meetings.getProcessingJob(meeting.id);
    let guard = 0;
    while (job && job.status !== 'completed' && guard < 20) {
      job = await services.meetings.tickProcessing(meeting.id);
      guard += 1;
    }
    expect(job?.status).toBe('completed');
    const aiPack = await services.meetings.getAIPack(meeting.id);
    const transcript = await services.transcripts.get(meeting.id);
    expect(aiPack).not.toBeNull();
    expect(transcript?.segments.length).toBeGreaterThan(0);
  });

  it('retry resets a failed job', async () => {
    const { services } = freshServices();
    const retried = await services.meetings.retryProcessing('m3');
    expect(retried.ok && retried.value.status).toBe('queued');
    expect(retried.ok && retried.value.errorCode).toBeUndefined();
  });
});

describe('speaker rename propagation', () => {
  it('rename flows into the export because names resolve via speakerId', async () => {
    const { services, store } = freshServices();
    await services.transcripts.renameSpeaker('m1', 'm1_sp3', 'Carlos');

    const db = store.read();
    const meeting = db.meetings.find((m) => m.id === 'm1')!;
    const aiPack = db.aiPacks.find((p) => p.meetingId === 'm1')!;
    const transcript = db.transcripts.find((t) => t.meetingId === 'm1')!;

    const result = runExport(
      { meeting, aiPack, transcript },
      { preset: 'full_fidelity', size: 'full', format: 'txt', language: 'en-US' },
    );
    expect(result.content).toContain('Carlos:');
    expect(result.content).not.toContain('Speaker 3:');
  });
});

describe('settings persistence', () => {
  it('deep-merges partial updates and persists across store reads', async () => {
    const { services, store } = freshServices();
    await services.settings.update('u1', { appearance: { theme: 'dark' } });
    const reloaded = await services.settings.get('u1');
    expect(reloaded.appearance.theme).toBe('dark');
    // Other appearance fields are preserved by the deep merge.
    expect(reloaded.appearance.density).toBe('comfortable');

    // A brand new store reading the same storage sees the persisted value.
    const snapshot = store.snapshot();
    expect(snapshot.settings.find((s) => s.userId === 'u1')?.appearance.theme).toBe('dark');
  });
});

describe('export history', () => {
  it('records a download in history', async () => {
    const { services } = freshServices();
    await services.exports.download('m1', {
      preset: 'ai_pack',
      size: 'standard',
      format: 'json',
      language: 'en-US',
    });
    const history = await services.exports.history('m1');
    expect(history.some((h) => h.format === 'json' && h.channel === 'download')).toBe(true);
  });
});
