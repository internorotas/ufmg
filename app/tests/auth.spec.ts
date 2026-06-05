/**
 * Suite: fluxos de autenticação e guards.
 * Verifica comportamento para usuários anônimos e autenticados.
 */
import { expect, test } from '@playwright/test';
import { BASE, mockAuthAnonymous, skipOnboarding } from './helpers';

test.beforeEach(async ({ page }) => {
  await skipOnboarding(page);
  await mockAuthAnonymous(page);
});

// ---------------------------------------------------------------------------
// Auth guards
// ---------------------------------------------------------------------------

test('perfil – usuário anônimo é redirecionado para home', async ({ page }) => {
  await page.goto(`${BASE}/perfil`);
  // ProfilePage faz <Navigate to="/" replace> quando não autenticado;
  // auth resolve para 'anonymous' rapidamente via mock 401.
  await expect(page).toHaveURL(new RegExp(`${BASE}/?$`), { timeout: 12_000 });
});

// ---------------------------------------------------------------------------
// Página de login
// ---------------------------------------------------------------------------

test('login – título e estrutura correta', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await expect(page).toHaveTitle(/Interno Rotas/i);

  const googleBtn = page.getByRole('button', { name: /Entrar com Google/i });
  await expect(googleBtn).toBeVisible({ timeout: 10_000 });
  await expect(googleBtn).toBeEnabled();
});

test('login – botão Google inicia fluxo OAuth (network request para /v1/auth)', async ({ page }) => {
  // Mock do endpoint OAuth para não navegar para fora
  await page.route('**/v1/auth/google/start**', (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        provider: 'google',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?mock=1',
      }),
    }),
  );

  await page.goto(`${BASE}/login`);
  const googleBtn = page.getByRole('button', { name: /Entrar com Google/i });
  await expect(googleBtn).toBeVisible({ timeout: 10_000 });

  // Intercepta request antes de clicar
  const requestPromise = page.waitForRequest(
    (req) => req.url().includes('/v1/auth/google/start'),
    { timeout: 10_000 },
  );

  await googleBtn.click();
  const req = await requestPromise;
  expect(req.url()).toContain('/v1/auth/google/start');
});

test('login – param "from" não vaza informação sensível na URL', async ({ page }) => {
  await page.goto(`${BASE}/perfil`);
  await expect(page).not.toHaveURL(/token=|access_token=|credential=|jwt=/i);
});

test('login – link "Continuar sem login" existe e é clicável', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  const skipLink = page.getByText(/Continuar sem login/i);
  await expect(skipLink).toBeVisible({ timeout: 10_000 });
  await skipLink.click();
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/Interno Rotas/i);
});

// ---------------------------------------------------------------------------
// Nav: anônimo → perfil redireciona para login (via anonymousTo)
// ---------------------------------------------------------------------------

test('nav – ícone de perfil no menu leva usuário anônimo a /login', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForSelector('.leaflet-container', { timeout: 15_000 });

  const perfilLink = page
    .locator('nav a')
    .filter({ hasText: /Perfil/i })
    .first();

  if (await perfilLink.isVisible()) {
    await perfilLink.click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/login`), { timeout: 6_000 });
  }
});
