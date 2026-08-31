import { defineConfig, devices } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';

/**
 * Real-API e2e (task §32). Starts the Fastify API against a dedicated Postgres
 * database and the Next.js app built in `api` mode, then drives the browser
 * against the real backend.
 */
const WEB_PORT = 3200;
const API_PORT = 4000;
const E2E_DB = process.env.E2E_DATABASE_URL ?? 'postgres://postgres@127.0.0.1:5433/loquia_e2e';
const baseURL = `http://localhost:${WEB_PORT}`;
const apiUrl = `http://localhost:${API_PORT}`;
// Mock providers exercise the real M5.2 pipeline (direct ingest → async submit →
// webhook callback → in-process AI Pack runner) without external credentials.
// No REDIS_URL: this mirrors the Render free plan where the API generates the AI
// Pack in-process (no separate worker, no Redis).
const DEEPGRAM_CALLBACK_SECRET = 'e2e-callback-secret';
const mediaEnv = {
  TRANSCRIPTION_PROVIDER: 'mock',
  AI_PACK_PROVIDER: 'mock',
  DEEPGRAM_CALLBACK_SECRET,
  PUBLIC_API_URL: apiUrl,
};

function resolveChromium(): string | undefined {
  if (process.env.PW_CHROMIUM_PATH) return process.env.PW_CHROMIUM_PATH;
  const root = '/opt/pw-browsers';
  if (!existsSync(root)) return undefined;
  const dir = readdirSync(root).find((d) => /^chromium-\d+$/.test(d));
  if (!dir) return undefined;
  const candidate = `${root}/${dir}/chrome-linux/chrome`;
  return existsSync(candidate) ? candidate : undefined;
}
const chromiumPath = resolveChromium();

export default defineConfig({
  testDir: './e2e-api',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: chromiumPath ? { executablePath: chromiumPath } : {} },
    },
  ],
  webServer: [
    {
      // Migrate + seed the e2e DB, then start the API. No worker and no Redis: the
      // API drains ai_pack jobs from Postgres in-process (Render free topology).
      // Playwright waits on the API's /health.
      command: `npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts && npx tsx src/index.ts`,
      cwd: '../api',
      url: `${apiUrl}/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        DATABASE_URL: E2E_DB,
        NODE_ENV: 'development',
        SESSION_SECRET: 'e2e-secret-0123456789-abcdef',
        APP_URL: baseURL,
        API_PORT: String(API_PORT),
        ...mediaEnv,
      },
    },
    {
      command: `npx next build && npx next start -p ${WEB_PORT}`,
      cwd: '.',
      url: `${baseURL}/pt-BR`,
      timeout: 240_000,
      reuseExistingServer: false,
      env: {
        NEXT_PUBLIC_APP_MODE: 'api',
        NEXT_PUBLIC_API_URL: apiUrl,
      },
    },
  ],
});
