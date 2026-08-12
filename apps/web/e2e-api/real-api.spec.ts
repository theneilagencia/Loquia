import { test, expect, request as pwRequest } from '@playwright/test';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

test('login → app → meetings from the real API → settings persist → logout', async ({ page }) => {
  await page.goto('/pt-BR/login');
  await page.getByLabel('E-mail').fill('vinicius@apymine.com');
  await page.getByLabel('Senha').fill('password123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/pt-BR\/app$/);

  // Meetings come from Postgres via the API.
  await page.goto('/pt-BR/app/meetings');
  await expect(page.getByText('Reunião comercial com Atlas')).toBeVisible();

  // Settings persistence: change a value, reload, still there (persisted in Postgres).
  await page.goto('/pt-BR/app/settings');
  await page.getByRole('tab', { name: 'Gravação' }).click();
  const countdown = page.getByRole('spinbutton').first();
  await countdown.fill('7');
  await countdown.blur();
  await page.waitForTimeout(500);
  await page.reload();
  await page.getByRole('tab', { name: 'Gravação' }).click();
  await expect(page.getByRole('spinbutton').first()).toHaveValue('7');

  // Logout returns to login and clears the session.
  const logout = page.getByRole('button', { name: 'Sair' });
  await logout.click();
  await expect(page).toHaveURL(/\/pt-BR\/login/);
});

test('request access → admin approval → activation → app (real API)', async ({ page, baseURL }) => {
  const email = `e2e-${Date.now()}@example.com`;

  // Public request through the UI (browser → API).
  await page.goto('/pt-BR/request-access');
  await page.getByLabel('Nome completo').fill('E2E Candidate');
  await page.getByLabel('E-mail corporativo').fill(email);
  await page.getByLabel('Empresa').fill('E2E Co');
  await page.getByLabel('Seu cargo').fill('PM');
  await page.getByLabel('Para que você quer usar a Loquia?').fill('Quero transformar reuniões em contexto para IA.');
  await page.getByRole('button', { name: 'Solicitar acesso' }).click();
  await expect(page).toHaveURL(/request-access\/success/);

  // Approve via the API as the seeded admin, capturing the one-time token.
  const api = await pwRequest.newContext({ baseURL: API });
  const loginRes = await api.post('/api/auth/login', { data: { email: 'vinicius@apymine.com', password: 'password123' } });
  expect(loginRes.ok()).toBeTruthy();
  const list = await (await api.get('/api/admin/access-requests?status=pending')).json();
  const req = list.find((r: { email: string }) => r.email === email);
  expect(req).toBeTruthy();
  const approve = await api.post(`/api/admin/access-requests/${req.id}/approve`);
  const token = (await approve.json()).token as string;
  expect(token).toBeTruthy();
  await api.dispose();

  // Activate through the UI → lands in onboarding, then the app.
  await page.goto(`/pt-BR/activate-account/${token}`);
  await expect(page.getByText(email)).toBeVisible();
  await page.getByLabel('Ative sua conta').fill('E2E Candidate');
  await page.locator('#password').fill('password123');
  await page.locator('#confirmPassword').fill('password123');
  await page.getByRole('button', { name: 'Ativar conta' }).click();
  await expect(page).toHaveURL(new RegExp(`${baseURL}/pt-BR/(onboarding|app)`));
});
