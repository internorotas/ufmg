import { expect, test } from '@playwright/test';

test('LineCard mantém ações acessíveis', async ({ page }) => {
  await page.goto('/ufmg/');

  await expect(page).toHaveTitle(/Interno Rotas/);

  const lineCard = page.locator('article[data-slot="card"]').first();
  await expect(lineCard).toBeVisible({ timeout: 10000 });

  const selectButton = lineCard.locator('button[data-slot="select-line"]');
  await expect(selectButton).toBeVisible();
  await expect(selectButton).toHaveAttribute('type', 'button');
  await expect(selectButton).toHaveAttribute('aria-describedby', /line-card-description-/);

  const detailsButton = lineCard.locator('button[data-slot="action"]');
  await expect(detailsButton).toBeVisible();
  await expect(detailsButton).toHaveAttribute('type', 'button');
  await expect(detailsButton).toHaveAttribute('aria-label', /Ver detalhes da linha/);

  const mobileMenuTrigger = page.locator('[data-slot="mobile-trigger"]');

  if (await mobileMenuTrigger.isVisible()) {
    await mobileMenuTrigger.click();
    await expect(page.locator('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'open');
  }

  await expect(page.getByRole('searchbox', { name: 'Pesquisar linha de ônibus' })).toBeVisible();
});
