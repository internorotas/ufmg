import { expect, type Page, test } from '@playwright/test';

async function openMenuOnMobileIfNeeded(page: Page) {
  const mobileTrigger = page.locator('[data-slot="mobile-trigger"]');
  if (await mobileTrigger.isVisible()) {
    await mobileTrigger.click();
    await expect(page.locator('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'open');
  }
}

test.describe('fluxos principais da aplicacao', () => {
  test('busca sem resultados e permite limpar filtro', async ({ page }) => {
    await page.goto('/ufmg/');
    await openMenuOnMobileIfNeeded(page);

    const searchInput = page.getByRole('searchbox', { name: 'Pesquisar linha de ônibus' });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('linha-inexistente-xyz');

    await expect(page.getByText('Nenhum resultado encontrado')).toBeVisible();

    await page.locator('button[data-slot="clear-button"]').click();
    await expect(page.locator('article[data-slot="card"]').first()).toBeVisible();
  });

  test('abre modal de detalhes e troca abas', async ({ page }) => {
    await page.goto('/ufmg/');
    await openMenuOnMobileIfNeeded(page);

    const firstCard = page.locator('article[data-slot="card"]').first();
    await expect(firstCard).toBeVisible();

    await firstCard.locator('button[data-slot="action"]').click();
    await expect(page.locator('[data-slot="dialog-popup"]')).toBeVisible();

    await page.getByRole('tab', { name: 'Todos os Horários' }).click();
    await expect(page.locator('#panel-horarios')).toBeVisible();

    await page.getByRole('tab', { name: 'Itinerário' }).click();
    await expect(page.locator('#panel-itinerario')).toBeVisible();

    await page.locator('button[data-slot="dialog-close"]').click();
    await expect(page.locator('[data-slot="dialog-popup"]')).toHaveCount(0);
  });

  test('alterna tema sem quebrar contraste de elementos chave', async ({ page }) => {
    await page.goto('/ufmg/');
    await openMenuOnMobileIfNeeded(page);

    const toggle = page.locator('button[data-slot="toggle"]').first();
    await expect(toggle).toBeVisible();

    const initialThemeClass = await page.evaluate(() => document.documentElement.className);
    await toggle.click();

    await expect
      .poll(async () => page.evaluate(() => document.documentElement.className))
      .not.toBe(initialThemeClass);

    await expect(page.locator('article[data-slot="card"]').first()).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Pesquisar linha de ônibus' })).toBeVisible();
  });

  test('fecha menu mobile pelo backdrop quando aplicavel', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'teste especifico para projeto mobile');

    await page.goto('/ufmg/');
    const trigger = page.locator('[data-slot="mobile-trigger"]');
    await expect(trigger).toBeVisible();
    await trigger.click();

    const sidebar = page.locator('[data-slot="sidebar"]');
    await expect(sidebar).toHaveAttribute('data-state', 'open');

    await page.locator('[data-slot="backdrop"]').click();
    await expect(sidebar).toHaveAttribute('data-state', 'closed');
  });
});
