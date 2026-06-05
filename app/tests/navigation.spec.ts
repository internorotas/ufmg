/**
 * Suite: navegação entre páginas via menu (BottomNav / NavRail).
 */
import { expect, test } from '@playwright/test';
import { BASE, skipOnboarding, waitForMap } from './helpers';

test.beforeEach(async ({ page }) => {
  await skipOnboarding(page);
  await page.goto(`${BASE}/`);
  await waitForMap(page);
});

test('nav – link "Linhas" navega para /linhas', async ({ page }) => {
  const link = page.locator('nav a[href*="/linhas"]').first();
  if (await link.isVisible()) {
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/linhas`), { timeout: 6_000 });
  }
});

test('nav – link "Ranking" navega para /ranking', async ({ page }) => {
  const link = page.locator('nav a[href*="/ranking"]').first();
  if (await link.isVisible()) {
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/ranking`), { timeout: 6_000 });
  }
});

test('nav – link "Mais" navega para /mais', async ({ page }) => {
  const link = page.locator('nav a[href*="/mais"]').first();
  if (await link.isVisible()) {
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/mais`), { timeout: 6_000 });
  }
});

test('nav – link "Mapa" volta para home', async ({ page }) => {
  // Vai para /linhas primeiro
  await page.goto(`${BASE}/linhas`);
  const mapaLink = page.locator('nav a[href$="/ufmg/"], nav a[href="/"]').first();
  if (await mapaLink.isVisible()) {
    await mapaLink.click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/?$`), { timeout: 6_000 });
  }
});

test('nav – botão voltar em /linhas retorna ao mapa', async ({ page }) => {
  await page.goto(`${BASE}/linhas`);
  const backBtn = page.getByRole('link', { name: /Voltar ao mapa/i });
  if (await backBtn.isVisible({ timeout: 5_000 })) {
    await backBtn.click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/?$`), { timeout: 6_000 });
  }
});

test('nav – histórico do browser funciona (back/forward)', async ({ page }) => {
  await page.goto(`${BASE}/linhas`);
  await expect(page).toHaveURL(new RegExp(`${BASE}/linhas`));

  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${BASE}/?$`), { timeout: 5_000 });

  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`${BASE}/linhas`), { timeout: 5_000 });
});
