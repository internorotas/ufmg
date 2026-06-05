import type { Page } from '@playwright/test';

/** Pula onboarding via Zustand persist key antes de navegar. */
export async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'onboarding',
      JSON.stringify({ state: { hasSeenOnboarding: true }, version: 0 }),
    );
  });
}

/**
 * Faz o auth resolver para estado "anônimo" imediatamente, sem esperar
 * pelo backend. Intercepta a chamada de refresh e retorna 401.
 * Chamar ANTES de page.goto().
 */
export async function mockAuthAnonymous(page: Page) {
  await page.route('**/v1/auth/refresh', (route) =>
    route.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthorized' }) }),
  );
}

/** Rota base do tenant (definida pelo VITE_BASE_PATH). */
export const BASE = '/ufmg';

/** Aguarda o mapa Leaflet estar montado no DOM. */
export async function waitForMap(page: Page) {
  await page.waitForSelector('.leaflet-container', { timeout: 15_000 });
}

/**
 * Garante que há linha cards visíveis na página.
 *
 * - Desktop: sidebar sempre aberta, cards na home.
 * - Mobile: sidebar começa fechada sem trigger DOM; navega para /linhas
 *   onde os cards são sempre visíveis (fluxo real do usuário mobile).
 *
 * Retorna onde os cards foram encontrados: 'home' ou 'linhas'.
 */
export async function ensureLineCardsVisible(page: Page): Promise<'home' | 'linhas'> {
  const sidebar = page.locator('[data-slot="sidebar"]');
  const state = await sidebar.getAttribute('data-state', { timeout: 2_000 }).catch(() => null);

  if (state === 'open') {
    return 'home';
  }

  // Mobile: sidebar fechada. Vai para /linhas onde os cards são acessíveis.
  await page.goto(`${BASE}/linhas`);
  await page.locator('article[data-slot="card"]').first().waitFor({ timeout: 12_000 });
  return 'linhas';
}

/**
 * Garante que o campo de busca de linha está visível.
 * No desktop usa a sidebar da home; no mobile usa /linhas.
 */
export async function ensureSearchVisible(page: Page) {
  const sidebar = page.locator('[data-slot="sidebar"]');
  const state = await sidebar.getAttribute('data-state', { timeout: 2_000 }).catch(() => null);

  if (state !== 'open') {
    await page.goto(`${BASE}/linhas`);
  }
}

/** @deprecated Use ensureLineCardsVisible instead */
export async function openSidebarIfNeeded(page: Page) {
  await ensureLineCardsVisible(page);
}
