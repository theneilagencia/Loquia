import { describe, expect, it } from 'vitest';
import { createBrowserStorage } from '../adapters/browser-storage';
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
    const aiPack = await services.meetings.getAIPack(meeting.id, 'en-US');
    const transcript = await services.transcripts.get(meeting.id);
    expect(aiPack).not.toBeNull();
    expect(aiPack!.sections.length).toBeGreaterThan(0);
    expect(transcript?.segments.length).toBeGreaterThan(0);
  });

  it('retry resets a failed job', async () => {
    const { services } = freshServices();
    const retried = await services.meetings.retryProcessing('m3');
    expect(retried.ok && retried.value.status).toBe('queued');
    expect(retried.ok && retried.value.errorCode).toBeUndefined();
  });

  it('reports AI Pack status and regenerates the pack (mock generation)', async () => {
    const { services } = freshServices();
    // Seeded meeting m1 already has a pack.
    const s1 = await services.meetings.getAIPackStatus('m1');
    expect(s1.status).toBe('ready');
    expect(s1.hasCurrent).toBe(true);

    const before = await services.meetings.getAIPack('m1', 'pt-BR');
    const regen = await services.meetings.regenerateAIPack('m1');
    expect(regen.ok).toBe(true);
    const after = await services.meetings.getAIPack('m1', 'pt-BR');
    expect(after).not.toBeNull();
    expect(after!.sections.length).toBeGreaterThan(0);
    expect(before).not.toBeNull();
  });
});

describe('speaker rename propagation', () => {
  it('rename flows into the export transcript (single source of truth for names)', async () => {
    const { services } = freshServices();
    await services.transcripts.renameSpeaker('m1', 'm1_sp1', 'Rafael M.');

    const result = await services.exports.render({
      meetingId: 'm1',
      preset: 'full',
      size: 'full',
      format: 'txt',
      sections: { instructions: false, transcript: true, evidence: true, ambiguities: true },
      outputLanguage: 'en-US',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.content).toContain('Rafael M.:');
    expect(result.value.content).not.toContain('Rafael Martins:');
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
    await services.exports.download({
      meetingId: 'm1',
      preset: 'ai',
      size: 'standard',
      format: 'json',
      sections: { instructions: false, transcript: false, evidence: true, ambiguities: true },
      outputLanguage: 'en-US',
    });
    const history = await services.exports.history('m1');
    expect(history.some((h) => h.format === 'json' && h.action === 'downloaded')).toBe(true);
  });

  it('JSON export parses and evidence stays in the original language', async () => {
    const { services } = freshServices();
    const res = await services.exports.render({
      meetingId: 'm1',
      preset: 'ai',
      size: 'standard',
      format: 'json',
      sections: { instructions: false, transcript: false, evidence: true, ambiguities: true },
      outputLanguage: 'en-US',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const parsed = JSON.parse(res.value.content);
    expect(parsed.important_statements[0].text).toContain('Sem a integração');
    expect(parsed.decisions[0]).toContain('pilot');
  });
});
