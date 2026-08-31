import { test, expect } from '@playwright/test';

test('login lands in the app', async ({ page }) => {
  await page.goto('/pt-BR/login');
  await page.getByLabel('E-mail').fill('vinicius@apymine.com');
  await page.getByLabel('Senha').fill('any-password');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/pt-BR\/app$/);
});

test('meeting detail opens on the AI Pack tab by default', async ({ page }) => {
  await page.goto('/pt-BR/app/meetings/m1');
  const aiPackTab = page.getByRole('tab', { name: 'AI Pack' });
  await expect(aiPackTab).toHaveAttribute('data-state', 'active');
});

test('AI Pack renders canonical sections and evidence stays in the original language', async ({ page }) => {
  await page.goto('/pt-BR/app/meetings/m1');
  await expect(page.getByRole('heading', { name: 'Meeting purpose' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Explicit decisions' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Important statements' })).toBeVisible();
  // Evidence quote preserved in Portuguese even though titles are canonical English.
  await expect(page.getByText('Sem a integração', { exact: false }).first()).toBeVisible();
});

test('theme preference persists across reload', async ({ page }) => {
  // The theme control lives in the authenticated app shell (design dropped it
  // from the marketing header); the seeded mock session renders the shell.
  await page.goto('/pt-BR/app');
  await page.getByRole('radio', { name: 'Escuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('locale switch updates the URL and nav language', async ({ page }) => {
  await page.goto('/pt-BR');
  await page.getByRole('button', { name: 'EN-US' }).click();
  await expect(page).toHaveURL(/\/en-US/);
  await expect(page.getByRole('link', { name: 'Product' }).first()).toBeVisible();
});
