import { expect, test } from '@playwright/test';

test('has title and LineCard is accessible', async ({ page }) => {
  // Use the correct base path
  await page.goto('http://localhost:5173/ufmg/');

  // Verify title
  await expect(page).toHaveTitle(/Interno Rotas/);

  // Verify LineCard accessibility
  // Wait for at least one LineCard to be present
  const lineCard = page.locator('article[data-slot="card"]').first();
  await expect(lineCard).toBeVisible({ timeout: 10000 });

  // Check label used by screen readers
  const ariaLabel = await lineCard.getAttribute('aria-label');
  expect(ariaLabel).toBeTruthy();

  // Check action button accessibility
  const detailsButton = lineCard.locator('button:has-text("Ver Detalhes")');
  await expect(detailsButton).toBeVisible();
  await expect(detailsButton).toHaveAttribute('type', 'button');
  const buttonLabel = await detailsButton.getAttribute('aria-label');
  expect(buttonLabel).toContain('Ver detalhes da linha');
});
