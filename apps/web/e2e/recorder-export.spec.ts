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

test('export produces a downloadable file from a ready meeting', async ({ page }) => {
  await page.goto('/pt-BR/app/meetings/m1');
  await page.getByRole('button', { name: 'Exportar' }).click();
  await expect(page.getByText('TranscriptSegment → AIPack → ExportEngine')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^loquia-.*-ai-pack\.md$/);
});
