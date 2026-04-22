import { expect, type Page, test } from '@playwright/test';

async function ensureSidebarOpenWhenMobile(page: Page) {
  const mobileTrigger = page.locator('[data-slot="mobile-trigger"]');
  if (await mobileTrigger.isVisible()) {
    await mobileTrigger.click();
    await expect(page.locator('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'open');
  }
}

test('carrega shell principal da aplicacao', async ({ page }) => {
  await page.goto('/ufmg/');

  await expect(page).toHaveTitle(/Interno Rotas/);

  await expect(page.getByRole('main', { name: 'Mapa das rotas' })).toBeVisible();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(
    page
      .locator('article[data-slot="card"]')
      .filter({ has: page.locator('button[data-slot="select-line"]') })
      .first(),
  ).toBeVisible();

  await ensureSidebarOpenWhenMobile(page);
  await expect(page.getByRole('searchbox', { name: 'Pesquisar linha de ônibus' })).toBeVisible();
});
