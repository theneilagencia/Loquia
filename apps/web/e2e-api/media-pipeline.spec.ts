import { test, expect, request as pwRequest, type APIRequestContext } from '@playwright/test';

/**
 * Real media pipeline e2e (task §47) with mock providers:
 *   upload-intent → PUT to (mock) storage → complete → BullMQ → worker → STT
 *   → diarization → TranscriptSegment[] → persistence → frontend.
 *
 * The storage and transcription providers are the deterministic mocks, so no R2
 * or Deepgram credentials are needed, but every other stage is real: the API
 * enqueues into a real Redis-backed BullMQ queue and the real worker process
 * consumes it and writes segments to Postgres.
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function login(): Promise<APIRequestContext> {
  const api = await pwRequest.newContext({ baseURL: API });
  const res = await api.post('/api/auth/login', {
    data: { email: 'vinicius@apymine.com', password: 'password123' },
  });
  expect(res.ok()).toBeTruthy();
  return api;
}

async function runPipeline(api: APIRequestContext): Promise<{ meetingId: string; jobId: string }> {
  // 1. Intent — creates the meeting + pending MediaAsset, returns a presigned PUT.
  const intentRes = await api.post('/api/meetings/upload-intent', {
    data: {
      title: 'Pipeline e2e',
      source: 'upload',
      meetingLanguage: 'pt-BR',
      filename: 'meeting.mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: 4096,
    },
  });
  expect(intentRes.ok()).toBeTruthy();
  const intent = await intentRes.json();
  expect(intent.meetingId).toBeTruthy();
  expect(intent.uploadUrl).toContain('/api/_mock-storage');

  // 2. Direct PUT of the bytes to (mock) storage — the API never proxies media.
  const put = await api.put(intent.uploadUrl, {
    headers: intent.requiredHeaders,
    data: Buffer.alloc(4096, 7),
  });
  expect(put.ok()).toBeTruthy();

  // 3. Complete — HEAD the object, create + enqueue the ProcessingJob.
  const completeRes = await api.post(`/api/media/${intent.mediaAssetId}/complete`);
  expect(completeRes.ok()).toBeTruthy();
  const job = await completeRes.json();
  expect(job.id).toBeTruthy();
  return { meetingId: intent.meetingId, jobId: job.id };
}

test('upload → queue → worker → transcript segments (mock providers)', async ({ page }) => {
  const api = await login();
  const { meetingId } = await runPipeline(api);

  // 4. Poll the meeting until the worker marks it ready (real async processing).
  await expect
    .poll(
      async () => {
        const res = await api.get(`/api/meetings/${meetingId}`);
        if (!res.ok()) return 'processing';
        return (await res.json()).status as string;
      },
      { timeout: 45_000, intervals: [500, 1000, 2000] },
    )
    .toBe('ready');

  // 5. Transcript is the source of truth: grouped segments, stable ids, speakers.
  const transcriptRes = await api.get(`/api/meetings/${meetingId}/transcript`);
  expect(transcriptRes.ok()).toBeTruthy();
  const transcript = await transcriptRes.json();
  const segments: { text: string; speakerId: string }[] = transcript.segments;
  expect(Array.isArray(segments)).toBeTruthy();
  expect(segments.length).toBeGreaterThan(1);
  // Segmentation groups words (not one-per-word) and preserves order + timing.
  expect(segments[0].text.split(' ').length).toBeGreaterThan(2);
  const speakerKeys = new Set(segments.map((s) => s.speakerId));
  expect(speakerKeys.size).toBeGreaterThanOrEqual(2);

  await api.dispose();

  // 6. Frontend: the meeting page shows the transcript and the honest
  //    AI-Pack-pending state — never a fabricated pack.
  await page.goto('/pt-BR/login');
  await page.getByLabel('E-mail').fill('vinicius@apymine.com');
  await page.getByLabel('Senha').fill('password123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/pt-BR\/app$/);

  // 7. AI Pack generates automatically (worker chains an ai_pack job after the
  //    transcript). Wait for it, then confirm the real pack — not the pending
  //    message — is rendered.
  const api2 = await login();
  await expect
    .poll(
      async () => (await (await api2.get(`/api/meetings/${meetingId}/ai-pack/status`)).json()).status as string,
      { timeout: 45_000, intervals: [500, 1000, 2000] },
    )
    .toBe('ready');
  const packRes = await api2.get(`/api/meetings/${meetingId}/aipack`);
  const pack = (await packRes.json()).source;
  expect(pack).toBeTruthy();
  expect(Array.isArray(pack.sections)).toBeTruthy();
  expect(pack.sections.length).toBeGreaterThan(1);
  await api2.dispose();

  await page.goto(`/pt-BR/app/meetings/${meetingId}`);
  // The AI Pack tab shows the real pack (Meeting section title), not "pending".
  await expect(page.getByText('Transcrição concluída. AI Pack ainda não processado.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Regenerar' })).toBeVisible();

  // The transcript tab renders the persisted segments.
  await page.getByRole('tab', { name: 'Transcrição' }).click();
  await expect(page.getByText(/Bom dia a todos/)).toBeVisible();
});
