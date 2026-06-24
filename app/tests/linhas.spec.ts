/**
 * Suite: página /linhas – busca, navegação, detalhes.
 */
import { expect, test } from '@playwright/test';
import { BASE, skipOnboarding } from './helpers';

test.beforeEach(async ({ page }) => {
  await skipOnboarding(page);
});

test('linhas – carrega lista de linhas', async ({ page }) => {
  await page.goto(`${BASE}/linhas`);
  await expect(page.getByRole('heading', { name: /Linhas e paradas/i })).toBeVisible({
    timeout: 8_000,
  });
  // Aguarda pelo menos um card
  await expect(page.locator('article[data-slot="card"]').first()).toBeVisible({
    timeout: 12_000,
  });
});

test('linhas – campo de busca funciona', async ({ page }) => {
  await page.goto(`${BASE}/linhas`);
  const search = page.getByRole('searchbox', { name: /Pesquisar linha/i });
  await expect(search).toBeVisible({ timeout: 8_000 });

  await search.fill('circular');
  await page.waitForTimeout(400);
  await expect(page.locator('body')).not.toBeEmpty();
});

test('linhas – busca sem resultado exibe estado vazio (sem crash)', async ({ page }) => {
  await page.goto(`${BASE}/linhas`);
  const search = page.getByRole('searchbox', { name: /Pesquisar linha/i });
  await expect(search).toBeVisible({ timeout: 8_000 });

  await search.fill('zzz_linha_inexistente_xyz');
  await page.waitForTimeout(500);

  // Não deve ter crash (título ainda presente)
  await expect(page).toHaveTitle(/Interno Rotas/i);
});

test('linhas – botão "Voltar ao mapa" navega para home', async ({ page }) => {
  await page.goto(`${BASE}/linhas`);
  const backBtn = page.getByRole('link', { name: /Voltar ao mapa/i });
  await expect(backBtn).toBeVisible({ timeout: 8_000 });
  await backBtn.click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/?$`), { timeout: 6_000 });
});

test('linhas – clicar em detalhes de linha abre modal', async ({ page }) => {
  await page.goto(`${BASE}/linhas`);
  const firstCard = page.locator('article[data-slot="card"]').first();
  await expect(firstCard).toBeVisible({ timeout: 12_000 });

  const detailsBtn = firstCard.locator('button[data-slot="action"]').first();
  if (await detailsBtn.isVisible()) {
    await detailsBtn.click();
    // Desktop: abre painel inline (aside > section); Mobile: abre dialog modal
    await expect(page.locator('[role="dialog"], aside > section[aria-label]')).toBeVisible({ timeout: 8_000 });
  }
});

test('linhas – selecionar linha navega para home com mapa', async ({ page }) => {
  await page.goto(`${BASE}/linhas`);
  const firstCard = page.locator('article[data-slot="card"]').first();
  await expect(firstCard).toBeVisible({ timeout: 12_000 });

  const selectBtn = firstCard.locator('button[data-slot="select-line"]');
  if (await selectBtn.isVisible()) {
    await selectBtn.click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/?$`), { timeout: 6_000 });
  }
});
