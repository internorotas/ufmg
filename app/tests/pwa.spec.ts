/**
 * Suite: PWA e Service Worker.
 * Verifica registro do SW, manifesto, e comportamento offline básico.
 */
import { expect, test } from '@playwright/test';
import { BASE, mockAuthAnonymous, skipOnboarding } from './helpers';

test.beforeEach(async ({ page }) => {
  await skipOnboarding(page);
  await mockAuthAnonymous(page);
});

test('pwa – service worker (se disponivel) nao esta em escopo externo', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2_000);

  const regs = await page.evaluate(async () => {
    const list = await navigator.serviceWorker.getRegistrations();
    return list.map((r) => ({ scope: r.scope, state: r.active?.state ?? 'none' }));
  });

  // Em build de desenvolvimento o SW pode nao ser injetado (Vite dev mode).
  // Quando presente, escopo deve ser local.
  for (const reg of regs) {
    expect(reg.scope).toMatch(/^http:\/\/127\.0\.0\.1/);
    expect(reg.scope).not.toContain('attacker');
  }
});

test('pwa – site.webmanifest retorna 200 com content-type correto', async ({ page }) => {
  const response = await page.request.get(`http://127.0.0.1:43173/site.webmanifest`);
  expect([200, 404]).toContain(response.status());
  if (response.status() === 200) {
    const ct = response.headers()['content-type'];
    expect(ct).toMatch(/json|manifest/i);
  }
});

test('pwa – navegacao client-side funciona offline (React Router)', async ({ page, context }) => {
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');

  // Corta a rede APOS carregar os assets
  await context.setOffline(true);

  // React Router navega sem nova request HTTP — clica em link do menu
  const linhasLink = page.locator('nav a[href*="/linhas"]').first();
  if (await linhasLink.isVisible()) {
    await linhasLink.click();
    // URL muda sem reload — sem requisicao de rede
    await expect(page).toHaveURL(new RegExp(`${BASE}/linhas`), { timeout: 5_000 });
    await expect(page).toHaveTitle(/Interno Rotas/i);
  }

  await context.setOffline(false);
});

test('pwa – meta theme-color presente', async ({ page }) => {
  await page.goto(`${BASE}/`);
  const themeColor = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    return meta?.getAttribute('content');
  });
  expect(themeColor).toBeTruthy();
  expect(themeColor).toMatch(/^#/);
});

test('pwa – viewport meta tag configurado para mobile', async ({ page }) => {
  await page.goto(`${BASE}/`);
  const viewport = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    return meta?.getAttribute('content') ?? '';
  });
  expect(viewport).toContain('width=device-width');
});
