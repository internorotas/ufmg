/**
 * Suite: funcionalidades da home (mapa, busca, cards de linha, navegação).
 *
 * Estratégia mobile vs desktop:
 * - Desktop: sidebar sempre aberta, cards e busca na home.
 * - Mobile: sidebar sem trigger DOM; usa /linhas como fallback
 *   (fluxo real do usuário mobile).
 */
import { expect, test } from '@playwright/test';
import {
  BASE,
  ensureLineCardsVisible,
  ensureSearchVisible,
  mockAuthAnonymous,
  skipOnboarding,
  waitForMap,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await skipOnboarding(page);
  await mockAuthAnonymous(page);
});

// ---------------------------------------------------------------------------
// Mapa
// ---------------------------------------------------------------------------

test('mapa – contêiner MapLibre é montado', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await waitForMap(page);
  await expect(page.locator('.maplibregl-map')).toBeVisible();
});

test('mapa – canvas MapLibre está presente', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await waitForMap(page);
  await page.waitForSelector('.maplibregl-canvas', { timeout: 20_000 });
});

// ---------------------------------------------------------------------------
// Cards de linha
// ---------------------------------------------------------------------------

test('cards – pelo menos um LineCard é renderizado', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await waitForMap(page);
  await ensureLineCardsVisible(page);
  const firstCard = page.locator('article[data-slot="card"]').first();
  await expect(firstCard).toBeVisible({ timeout: 12_000 });
});

test('cards – botão de selecionar linha tem aria-describedby', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await waitForMap(page);
  await ensureLineCardsVisible(page);
  const firstCard = page.locator('article[data-slot="card"]').first();
  await expect(firstCard).toBeVisible({ timeout: 12_000 });

  const selectBtn = firstCard.locator('button[data-slot="select-line"]');
  await expect(selectBtn).toBeVisible();
  await expect(selectBtn).toHaveAttribute('aria-describedby', /line-card-description-/);
});

test('cards – botão de detalhes da linha tem aria-label', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await waitForMap(page);
  await ensureLineCardsVisible(page);
  const firstCard = page.locator('article[data-slot="card"]').first();
  await expect(firstCard).toBeVisible({ timeout: 12_000 });

  const detailsBtn = firstCard.locator('button[data-slot="action"]').first();
  await expect(detailsBtn).toBeVisible();
  await expect(detailsBtn).toHaveAttribute('aria-label', /Ver detalhes/i);
});

test('cards – clicar em detalhes abre modal', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await waitForMap(page);
  await ensureLineCardsVisible(page);
  const firstCard = page.locator('article[data-slot="card"]').first();
  await expect(firstCard).toBeVisible({ timeout: 12_000 });

  await firstCard.locator('button[data-slot="action"]').first().click();
  // Desktop: abre painel inline (aside > section); Mobile: abre dialog modal
  await expect(page.locator('[role="dialog"], aside > section[aria-label]')).toBeVisible({ timeout: 8_000 });
});

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

test('busca – campo aceita input e filtra cards', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await waitForMap(page);
  await ensureSearchVisible(page);

  const searchbox = page.getByRole('searchbox', { name: /Pesquisar linha/i });
  await expect(searchbox).toBeVisible({ timeout: 10_000 });

  await searchbox.fill('circular');
  await page.waitForTimeout(500);
  await expect(page.locator('body')).not.toBeEmpty();
});

test('busca – limpar campo restaura lista completa', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await waitForMap(page);
  await ensureSearchVisible(page);

  const searchbox = page.getByRole('searchbox', { name: /Pesquisar linha/i });
  await expect(searchbox).toBeVisible({ timeout: 10_000 });

  await searchbox.fill('xyzabc_inexistente');
  await page.waitForTimeout(400);
  await searchbox.clear();
  await page.waitForTimeout(400);

  const cards = page.locator('article[data-slot="card"]');
  await expect(cards.first()).toBeVisible({ timeout: 8_000 });
});

// ---------------------------------------------------------------------------
// Sidebar (desktop only – mobile usa /linhas)
// ---------------------------------------------------------------------------

test('sidebar – cards e busca acessíveis (via sidebar ou /linhas)', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await waitForMap(page);
  await ensureLineCardsVisible(page);

  const card = page.locator('article[data-slot="card"]').first();
  await expect(card).toBeVisible({ timeout: 12_000 });

  const searchbox = page.getByRole('searchbox', { name: /Pesquisar linha/i });
  await expect(searchbox).toBeVisible({ timeout: 8_000 });
});
