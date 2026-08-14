import { test, expect, request as pwRequest, type APIRequestContext } from '@playwright/test';
import postgres from 'postgres';

/**
 * Real media pipeline e2e (M5.2 async model) with mock providers:
 *   process-audio (raw body) → submit → 202 (request_id persisted) → provider
 *   callback → webhook maps + persists TranscriptSegment[] → BullMQ → worker →
 *   AI Pack → frontend.
 *
 * No object storage and no external credentials: the transcription + AI Pack
 * providers are the deterministic mocks, but every other stage is real (the API
 * enqueues into a real Redis-backed BullMQ queue and the real worker consumes it
 * and writes segments/pack to Postgres). The provider callback is driven by
 * reading the persisted `provider_request_id` from the e2e database.
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const E2E_DB = process.env.E2E_DATABASE_URL ?? 'postgres://postgres@127.0.0.1:5433/loquia_e2e';
const CALLBACK_SECRET = 'e2e-callback-secret';

async function login(): Promise<APIRequestContext> {
  const api = await pwRequest.newContext({ baseURL: API });
  const res = await api.post('/api/auth/login', { data: { email: 'vinicius@apymine.com', password: 'password123' } });
  expect(res.ok()).toBeTruthy();
  return api;
}

/** The provider request id the API persisted for a transcription job. */
async function providerRequestId(processingJobId: string): Promise<string> {
  const sql = postgres(E2E_DB, { max: 1 });
  try {
    const rows = await sql`select provider_request_id from processing_jobs where id = ${processingJobId} limit 1`;
    return rows[0]?.provider_request_id as string;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

test('process-audio → submit → callback → transcript → AI Pack (mock providers)', async ({ page }) => {
  const api = await login();

  // 1. Submit the recording for processing — 202, no long work in the request.
  const res = await api.post('/api/meetings/process-audio?title=Pipeline%20e2e&meetingLanguage=pt-BR&source=recording&durationSeconds=12', {
    headers: { 'content-type': 'audio/webm' },
    data: Buffer.alloc(4096, 7),
  });
  expect(res.status()).toBe(202);
  const { meetingId, processingJobId } = await res.json();
  expect(meetingId).toBeTruthy();

  // 2. The provider callback arrives out-of-band — drive it with the persisted id.
  const requestId = await providerRequestId(processingJobId);
  expect(requestId).toMatch(/^mock-req-/);
  const cb = await api.post(`/api/webhooks/deepgram?token=${CALLBACK_SECRET}`, {
    headers: { 'content-type': 'application/json' },
    data: { request_id: requestId, language: 'pt-BR' },
  });
  expect(cb.status()).toBe(200);
  expect((await cb.json()).status).toBe('completed');

  // 3. Duplicate callback is idempotent (§31).
  const dup = await api.post(`/api/webhooks/deepgram?token=${CALLBACK_SECRET}`, {
    headers: { 'content-type': 'application/json' },
    data: { request_id: requestId, language: 'pt-BR' },
  });
  expect((await dup.json()).status).toBe('duplicate');

  // 4. The meeting is ready and the transcript is the source of truth.
  await expect
    .poll(async () => (await (await api.get(`/api/meetings/${meetingId}`)).json()).status as string, { timeout: 15_000, intervals: [300, 700, 1500] })
    .toBe('ready');
  const transcript = await (await api.get(`/api/meetings/${meetingId}/transcript`)).json();
  const segments: { text: string; speakerId: string }[] = transcript.segments;
  expect(segments.length).toBeGreaterThan(1);
  expect(segments[0].text.split(' ').length).toBeGreaterThan(2);
  expect(new Set(segments.map((s) => s.speakerId)).size).toBeGreaterThanOrEqual(2);
  await api.dispose();

  // 5. AI Pack generates automatically (worker chains the ai_pack job).
  const api2 = await login();
  await expect
    .poll(async () => (await (await api2.get(`/api/meetings/${meetingId}/ai-pack/status`)).json()).status as string, { timeout: 45_000, intervals: [500, 1000, 2000] })
    .toBe('ready');
  const pack = (await (await api2.get(`/api/meetings/${meetingId}/aipack`)).json()).source;
  expect(Array.isArray(pack.sections)).toBeTruthy();
  expect(pack.sections.length).toBeGreaterThan(1);
  await api2.dispose();

  // 6. Frontend renders the real pack + transcript (never a fabricated pack).
  await page.goto('/pt-BR/login');
  await page.getByLabel('E-mail').fill('vinicius@apymine.com');
  await page.getByLabel('Senha').fill('password123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/pt-BR\/app$/);
  await page.goto(`/pt-BR/app/meetings/${meetingId}`);
  await expect(page.getByText('Transcrição concluída. AI Pack ainda não processado.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Regenerar' })).toBeVisible();
  await page.getByRole('tab', { name: 'Transcrição' }).click();
  await expect(page.getByText(/Bom dia a todos/)).toBeVisible();
});
