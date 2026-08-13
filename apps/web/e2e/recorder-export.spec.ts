import { test, expect } from '@playwright/test';

// The recorder uses a simulated capture in mock mode, so this runs headless
// without a microphone.
test('recorder runs and the mini-recorder persists across navigation', async ({ page, context }) => {
  await context.grantPermissions(['microphone']);
  await page.goto('/pt-BR/app/record');
  await page.getByLabel('Gravar').fill('E2E recording');
  await page.getByRole('button', { name: 'Iniciar gravação' }).click();
  await expect(page.getByText('Gravando')).toBeVisible();

  // Navigate away via in-app (SPA) navigation so recorder state is preserved —
  // the persistent mini recorder should then appear.
  await page.getByRole('link', { name: 'Reuniões' }).first().click();
  await expect(page).toHaveURL(/\/app\/meetings$/);
  await expect(page.getByLabel('Concluir')).toBeVisible();
});

test('recording is persisted on-device and survives a reload (Local First)', async ({ page, context }) => {
  await context.grantPermissions(['microphone']);
  await page.goto('/pt-BR/app/record');
  await page.getByLabel('Gravar').fill('Local first recording');
  await page.getByRole('button', { name: 'Iniciar gravação' }).click();
  await expect(page.getByText('Gravando')).toBeVisible();
  await page.getByRole('button', { name: 'Concluir' }).click();
  // finish() navigates to the processing page once the local copy is persisted.
  await expect(page).toHaveURL(/\/app\/meetings\/.+\/processing$/);

  const hasLocal = async () =>
    page.evaluate(() =>
      Object.keys(window.localStorage)
        .filter((k) => k.includes('localmedia:'))
        .some((k) => {
          const v = window.localStorage.getItem(k);
          return v != null && Object.keys(JSON.parse(v)).length > 0;
        }),
    );
  expect(await hasLocal()).toBe(true);
  await page.reload();
  expect(await hasLocal()).toBe(true); // survives refresh (§8/§50)
});

test('a meeting with no on-device recording shows the honest second-device state', async ({ page }) => {
  await page.goto('/pt-BR/app/meetings/m1');
  await expect(page.getByText(/armazenada em outro dispositivo/i)).toBeVisible();
});

test('export produces a downloadable file from a ready meeting', async ({ page }) => {
  await page.goto('/pt-BR/app/meetings/m1');
  await page.getByRole('button', { name: 'Exportar' }).click();
  await expect(page.getByText('TranscriptSegment → AIPack → ExportEngine')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^loquia-.*-ai-pack\.md$/);
});
