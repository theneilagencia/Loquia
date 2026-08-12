import { test, expect } from '@playwright/test';

test('home renders hero and CTA', async ({ page }) => {
  await page.goto('/pt-BR');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Transforme reuniões em contexto pronto para usar',
  );
});

test('request access flow reaches the success page', async ({ page }) => {
  await page.goto('/pt-BR/request-access');
  await page.getByLabel('Nome completo').fill('João Tester');
  await page.getByLabel('E-mail corporativo').fill('joao.tester@example.com');
  await page.getByLabel('Empresa').fill('Example Co');
  await page.getByLabel('Seu cargo').fill('PM');
  await page
    .getByLabel('Para que você quer usar a Loquia?')
    .fill('Quero transformar reuniões de produto em contexto para IA.');
  await page.getByRole('button', { name: 'Solicitar acesso' }).click();
  await expect(page).toHaveURL(/request-access\/success/);
  await expect(page.getByRole('heading', { name: 'Solicitação recebida' })).toBeVisible();
});
