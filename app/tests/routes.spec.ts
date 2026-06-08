/**
 * Suite: carregamento de todas as rotas públicas.
 * Verifica que cada página monta sem crash, exibe título correto e
 * elementos-chave estão presentes.
 */
import { expect, test } from '@playwright/test';
import {
  BASE,
  ensureLineCardsVisible,
  ensureSearchVisible,
  mockAuthAnonymous,
  skipOnboarding,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await skipOnboarding(page);
  await mockAuthAnonymous(page);
});

test('home – mapa e cards de linha carregam', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await expect(page).toHaveTitle(/Interno Rotas/i);
  await page.waitForSelector('.leaflet-container', { timeout: 15_000 });
  await ensureLineCardsVisible(page);
  const lineCard = page.locator('article[data-slot="card"]').first();
  await expect(lineCard).toBeVisible({ timeout: 12_000 });
});

test('home – campo de busca está acessível', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForSelector('.leaflet-container', { timeout: 15_000 });
  await ensureSearchVisible(page);
  await expect(page.getByRole('searchbox', { name: /Pesquisar linha/i })).toBeVisible({
    timeout: 10_000,
  });
});

test('login – renderiza botão Google e link anonimato', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await expect(page).toHaveTitle(/Interno Rotas/i);
  await expect(page.getByRole('button', { name: /Entrar com Google/i })).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.getByText(/Continuar sem login/i)).toBeVisible();
});

test('sobre – carrega sem erro', async ({ page }) => {
  await page.goto(`${BASE}/sobre`);
  await expect(page).toHaveTitle(/Interno Rotas/i);
  await expect(page.getByRole('heading', { name: /Sobre/i })).toBeVisible({ timeout: 8_000 });
});

test('privacidade – carrega sem erro', async ({ page }) => {
  await page.goto(`${BASE}/privacidade`);
  await expect(page).toHaveTitle(/Interno Rotas/i);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();
});

test('termos – carrega sem erro', async ({ page }) => {
  await page.goto(`${BASE}/termos`);
  await expect(page).toHaveTitle(/Interno Rotas/i);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();
});

test('linhas – página carrega com header e busca', async ({ page }) => {
  await page.goto(`${BASE}/linhas`);
  await expect(page).toHaveTitle(/Interno Rotas/i);
  await expect(page.getByRole('heading', { name: /Linhas e paradas/i })).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.getByRole('searchbox', { name: /Pesquisar linha/i })).toBeVisible();
});

test('ranking – carrega sem erro', async ({ page }) => {
  await page.goto(`${BASE}/ranking`);
  await expect(page).toHaveTitle(/Interno Rotas/i);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();
});

test('mais – carrega sem erro', async ({ page }) => {
  await page.goto(`${BASE}/mais`);
  await expect(page).toHaveTitle(/Interno Rotas/i);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();
});

test('pesquisa – carrega sem erro', async ({ page }) => {
  await page.goto(`${BASE}/pesquisa`);
  await expect(page).toHaveTitle(/Interno Rotas/i);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();
});

test('rota inexistente não quebra o app (SPA fallback)', async ({ page }) => {
  await page.goto(`${BASE}/rota-que-nao-existe-404`);
  await expect(page).toHaveTitle(/Interno Rotas/i);
});
