import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createUser, createWorkspace, login, makeTestApp, truncateAll, type TestApp } from './helpers';

let t: TestApp;
beforeAll(async () => { t = await makeTestApp(); });
afterAll(async () => { await t.close(); });
beforeEach(async () => { await truncateAll(t.db); });

async function ownerCookie() {
  const ws = await createWorkspace(t.db, 'Org');
  await createUser(t.db, { email: 'owner@org.com', workspaceId: ws, role: 'owner' });
  return login(t.app, 'owner@org.com');
}

describe('meeting metadata persistence', () => {
  it('create → queued job → tick to ready generates demo transcript + AI Pack', async () => {
    const cookie = await ownerCookie();
    const created = await t.app.inject({ method: 'POST', url: '/api/meetings', headers: { cookie }, payload: { title: 'New meeting', source: 'upload', meetingLanguage: 'pt-BR', durationSeconds: 120 } });
    expect(created.statusCode).toBe(200);
    const meeting = JSON.parse(created.body);
    expect(meeting.status).toBe('processing');

    let job = JSON.parse((await t.app.inject({ method: 'GET', url: `/api/meetings/${meeting.id}/job`, headers: { cookie } })).body);
    let guard = 0;
    while (job && job.status !== 'completed' && guard < 20) {
      job = JSON.parse((await t.app.inject({ method: 'POST', url: `/api/meetings/${meeting.id}/job/tick`, headers: { cookie } })).body);
      guard += 1;
    }
    expect(job.status).toBe('completed');

    const transcript = JSON.parse((await t.app.inject({ method: 'GET', url: `/api/meetings/${meeting.id}/transcript`, headers: { cookie } })).body);
    expect(transcript.segments.length).toBeGreaterThan(0);
    const pack = JSON.parse((await t.app.inject({ method: 'GET', url: `/api/meetings/${meeting.id}/aipack`, headers: { cookie } })).body);
    expect(pack.source.sections.length).toBeGreaterThan(0);
  });

  it('rename and archive/unarchive; list excludes archived by default', async () => {
    const cookie = await ownerCookie();
    const created = JSON.parse((await t.app.inject({ method: 'POST', url: '/api/meetings', headers: { cookie }, payload: { title: 'Draft', source: 'recording' } })).body);
    await t.app.inject({ method: 'PATCH', url: `/api/meetings/${created.id}`, headers: { cookie }, payload: { title: 'Renamed' } });
    const got = JSON.parse((await t.app.inject({ method: 'GET', url: `/api/meetings/${created.id}`, headers: { cookie } })).body);
    expect(got.title).toBe('Renamed');

    await t.app.inject({ method: 'POST', url: `/api/meetings/${created.id}/archive`, headers: { cookie } });
    const list = JSON.parse((await t.app.inject({ method: 'GET', url: '/api/meetings', headers: { cookie } })).body);
    expect(list.find((m: { id: string }) => m.id === created.id)).toBeUndefined();
    const listAll = JSON.parse((await t.app.inject({ method: 'GET', url: '/api/meetings?includeArchived=true', headers: { cookie } })).body);
    expect(listAll.find((m: { id: string }) => m.id === created.id)).toBeTruthy();
  });
});

describe('settings persistence', () => {
  it('returns defaults then deep-merges and persists a patch', async () => {
    const cookie = await ownerCookie();
    const initial = JSON.parse((await t.app.inject({ method: 'GET', url: '/api/settings', headers: { cookie } })).body);
    expect(initial.appearance.theme).toBe('system');

    await t.app.inject({ method: 'PATCH', url: '/api/settings', headers: { cookie }, payload: { appearance: { theme: 'dark' } } });
    const after = JSON.parse((await t.app.inject({ method: 'GET', url: '/api/settings', headers: { cookie } })).body);
    expect(after.appearance.theme).toBe('dark');
    expect(after.appearance.density).toBe('comfortable'); // preserved by deep-merge
  });
});

describe('export preset persistence', () => {
  it('creates, lists, sets default and deletes a custom preset', async () => {
    const cookie = await ownerCookie();
    const preset = { name: 'My preset', description: '', basePreset: 'analysis', size: 'full', format: 'json', sections: { instructions: true, transcript: true, evidence: true, ambiguities: true } };
    const created = JSON.parse((await t.app.inject({ method: 'POST', url: '/api/presets', headers: { cookie }, payload: preset })).body);
    expect(created.id).toBeTruthy();

    await t.app.inject({ method: 'POST', url: `/api/presets/${created.id}/default`, headers: { cookie } });
    const list = JSON.parse((await t.app.inject({ method: 'GET', url: '/api/presets', headers: { cookie } })).body);
    expect(list.find((p: { id: string }) => p.id === created.id).isDefault).toBe(true);

    const del = await t.app.inject({ method: 'DELETE', url: `/api/presets/${created.id}`, headers: { cookie } });
    expect(del.statusCode).toBe(200);
  });
});

describe('ProcessingJob', () => {
  it('creates and updates a job through the internal endpoints', async () => {
    const cookie = await ownerCookie();
    const meeting = JSON.parse((await t.app.inject({ method: 'POST', url: '/api/meetings', headers: { cookie }, payload: { title: 'J', source: 'upload' } })).body);
    const job = JSON.parse((await t.app.inject({ method: 'POST', url: '/api/jobs', headers: { cookie }, payload: { meetingId: meeting.id, type: 'transcription' } })).body);
    expect(job.status).toBe('queued');
    const updated = JSON.parse((await t.app.inject({ method: 'PATCH', url: `/api/jobs/${job.id}`, headers: { cookie }, payload: { status: 'failed', errorCode: 'X' } })).body);
    expect(updated.status).toBe('failed');
    expect(updated.errorCode).toBe('X');
  });
});

describe('audit is append-only via the API', () => {
  it('exposes a read endpoint and no mutation endpoints', async () => {
    const ws = await createWorkspace(t.db, 'Org2');
    await createUser(t.db, { email: 'admin2@org.com', workspaceId: ws, role: 'admin' });
    const cookie = await login(t.app, 'admin2@org.com');
    const res = await t.app.inject({ method: 'GET', url: '/api/admin/audit', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    // login itself produced an audit event
    expect(JSON.parse(res.body).total).toBeGreaterThanOrEqual(1);
    // there is no DELETE route for audit
    const del = await t.app.inject({ method: 'DELETE', url: '/api/admin/audit', headers: { cookie } });
    expect(del.statusCode).toBe(404);
  });
});
