import { expect, test } from '@playwright/test';
import { ensureLineCardsVisible, ensureSearchVisible, mockAuthAnonymous } from './helpers';

test('LineCard mantém ações acessíveis', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'onboarding',
      JSON.stringify({ state: { hasSeenOnboarding: true }, version: 0 }),
    );
  });
  await mockAuthAnonymous(page);

  await page.goto('/ufmg/');
  await expect(page).toHaveTitle(/Interno Rotas/);

  // Desktop: sidebar já aberta. Mobile: navega para /linhas.
  await ensureLineCardsVisible(page);

  const lineCard = page.locator('article[data-slot="card"]').first();
  await expect(lineCard).toBeVisible({ timeout: 12_000 });

  const selectButton = lineCard.locator('button[data-slot="select-line"]');
  await expect(selectButton).toBeVisible();
  await expect(selectButton).toHaveAttribute('type', 'button');
  await expect(selectButton).toHaveAttribute('aria-describedby', /line-card-description-/);

  const detailsButton = lineCard.locator('button[data-slot="action"]').first();
  await expect(detailsButton).toBeVisible();
  await expect(detailsButton).toHaveAttribute('type', 'button');
  await expect(detailsButton).toHaveAttribute('aria-label', /Ver detalhes da linha/);

  await ensureSearchVisible(page);
  await expect(page.getByRole('searchbox', { name: /Pesquisar linha/i })).toBeVisible();
});
