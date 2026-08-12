import { defineConfig, devices } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

/**
 * Resolve a Chromium executable. Prefers PW_CHROMIUM_PATH, then any pre-installed
 * build under /opt/pw-browsers (whose revision may differ from the pinned
 * @playwright/test), else falls back to Playwright's own managed browser.
 */
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
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  timeout: 45_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use the environment's pre-installed Chromium instead of downloading,
        // since the pinned @playwright/test revision differs from what's on disk.
        launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
      },
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
