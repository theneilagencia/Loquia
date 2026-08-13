import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createUser, createWorkspace, login, makeTestApp, truncateAll, type TestApp } from './helpers';
import { mediaAssets, processingJobs } from '../db/schema';

let t: TestApp;
beforeAll(async () => { t = await makeTestApp(); });
afterAll(async () => { await t.close(); });
beforeEach(async () => { await truncateAll(t.db); });

async function ownerCookie(name = 'Org') {
  const ws = await createWorkspace(t.db, name);
  await createUser(t.db, { email: `owner@${name.toLowerCase()}.com`, workspaceId: ws, role: 'owner' });
  return { cookie: await login(t.app, `owner@${name.toLowerCase()}.com`), ws };
}

function mockStoragePath(uploadUrl: string): string {
  return uploadUrl.replace(/^https?:\/\/[^/]+/, '');
}

describe('direct upload flow', () => {
  it('intent → PUT to storage → complete creates an uploaded asset + queued job', async () => {
    const { cookie } = await ownerCookie();
    const intent = await t.app.inject({
      method: 'POST',
      url: '/api/meetings/upload-intent',
      headers: { cookie },
      payload: { title: 'Sales call', source: 'upload', meetingLanguage: 'pt-BR', filename: 'call.webm', mimeType: 'audio/webm', sizeBytes: 4 },
    });
    expect(intent.statusCode).toBe(200);
    const { meetingId, mediaAssetId, uploadUrl, requiredHeaders } = JSON.parse(intent.body);
    expect(meetingId).toBeTruthy();
    expect(uploadUrl).toContain('/api/_mock-storage?key=');
    expect(requiredHeaders['content-type']).toBe('audio/webm');

    // Browser uploads bytes directly to storage (mock endpoint here).
    const put = await t.app.inject({ method: 'PUT', url: mockStoragePath(uploadUrl), headers: { 'content-type': 'audio/webm' }, payload: Buffer.from([1, 2, 3, 4]) });
    expect(put.statusCode).toBe(200);

    const complete = await t.app.inject({ method: 'POST', url: `/api/media/${mediaAssetId}/complete`, headers: { cookie } });
    expect(complete.statusCode).toBe(200);
    const job = JSON.parse(complete.body);
    expect(job.status).toBe('queued');
    expect(job.stage).toBe('received');

    const asset = (await t.db.select().from(mediaAssets).where(eq(mediaAssets.id, mediaAssetId)))[0]!;
    expect(asset.status).toBe('uploaded');
    expect(asset.sizeBytes).toBe(4);
    const jobs = await t.db.select().from(processingJobs).where(eq(processingJobs.meetingId, meetingId));
    expect(jobs).toHaveLength(1);
  });

  it('reprocess (§39) mints a fresh temporary asset for an existing meeting from the local copy', async () => {
    const { cookie } = await ownerCookie('Reproc');
    const intent = await t.app.inject({ method: 'POST', url: '/api/meetings/upload-intent', headers: { cookie }, payload: { title: 'Retry me', source: 'recording', meetingLanguage: 'pt-BR', filename: 'r.webm', mimeType: 'audio/webm', sizeBytes: 4 } });
    const { meetingId, mediaAssetId: firstAsset } = JSON.parse(intent.body);

    const re = await t.app.inject({ method: 'POST', url: `/api/meetings/${meetingId}/reprocess`, headers: { cookie }, payload: { filename: 'r.webm', mimeType: 'audio/webm', sizeBytes: 4 } });
    expect(re.statusCode).toBe(200);
    const body = JSON.parse(re.body);
    expect(body.meetingId).toBe(meetingId);
    expect(body.mediaAssetId).not.toBe(firstAsset); // a new temporary copy
    expect(body.uploadUrl).toContain('/api/_mock-storage?key=');

    // The new asset exists for the SAME meeting; no new meeting was created.
    const assets = await t.db.select().from(mediaAssets).where(eq(mediaAssets.meetingId, meetingId));
    expect(assets.length).toBe(2);
    const put = await t.app.inject({ method: 'PUT', url: mockStoragePath(body.uploadUrl), headers: { 'content-type': 'audio/webm' }, payload: Buffer.from([1, 2, 3, 4]) });
    expect(put.statusCode).toBe(200);
    const complete = await t.app.inject({ method: 'POST', url: `/api/media/${body.mediaAssetId}/complete`, headers: { cookie } });
    expect(complete.statusCode).toBe(200);
  });

  it('reprocess is workspace-isolated', async () => {
    const a = await ownerCookie('RA');
    const intent = await t.app.inject({ method: 'POST', url: '/api/meetings/upload-intent', headers: { cookie: a.cookie }, payload: { title: 'x', source: 'recording', meetingLanguage: 'pt-BR', filename: 'x.webm', mimeType: 'audio/webm', sizeBytes: 4 } });
    const { meetingId } = JSON.parse(intent.body);
    const b = await ownerCookie('RB');
    const re = await t.app.inject({ method: 'POST', url: `/api/meetings/${meetingId}/reprocess`, headers: { cookie: b.cookie }, payload: { filename: 'x.webm', mimeType: 'audio/webm', sizeBytes: 4 } });
    expect(re.statusCode).toBe(404);
  });

  it('rejects unsupported media types at intent', async () => {
    const { cookie } = await ownerCookie('Org2');
    const res = await t.app.inject({ method: 'POST', url: '/api/meetings/upload-intent', headers: { cookie }, payload: { title: 'x', filename: 'x.zip', mimeType: 'application/zip', sizeBytes: 10 } });
    expect(res.statusCode).toBe(400);
  });

  it('completing before the object exists fails (does not trust the client)', async () => {
    const { cookie } = await ownerCookie('Org3');
    const intent = await t.app.inject({ method: 'POST', url: '/api/meetings/upload-intent', headers: { cookie }, payload: { title: 'y', filename: 'y.mp3', mimeType: 'audio/mpeg', sizeBytes: 4 } });
    const { mediaAssetId } = JSON.parse(intent.body);
    const complete = await t.app.inject({ method: 'POST', url: `/api/media/${mediaAssetId}/complete`, headers: { cookie } });
    expect(complete.statusCode).toBe(400); // HEAD finds nothing
  });

  it('workspace isolation: another workspace cannot complete a foreign media asset', async () => {
    const a = await ownerCookie('AA');
    const intent = await t.app.inject({ method: 'POST', url: '/api/meetings/upload-intent', headers: { cookie: a.cookie }, payload: { title: 'z', filename: 'z.mp3', mimeType: 'audio/mpeg', sizeBytes: 4 } });
    const { mediaAssetId } = JSON.parse(intent.body);

    const b = await ownerCookie('BB');
    const complete = await t.app.inject({ method: 'POST', url: `/api/media/${mediaAssetId}/complete`, headers: { cookie: b.cookie } });
    expect(complete.statusCode).toBe(404);
  });
});
