import { test, expect } from "@playwright/test";

test("has title and LineCard is accessible", async ({ page }) => {
  // Use the correct base path
  await page.goto("http://localhost:5173/ufmg/");

  // Verify title
  await expect(page).toHaveTitle(/Interno Rotas/);

  // Verify LineCard accessibility
  // Wait for at least one LineCard to be present
  const lineCard = page.locator('article[role="button"]').first();
  await expect(lineCard).toBeVisible({ timeout: 10000 });

  // Check attributes
  await expect(lineCard).toHaveAttribute("tabindex", "0");
  const ariaLabel = await lineCard.getAttribute("aria-label");
  expect(ariaLabel).toContain("Selecionar linha");

  // Check inner button
  const detailsButton = lineCard.locator('button:has-text("Ver Detalhes")');
  await expect(detailsButton).toBeVisible();
  const buttonLabel = await detailsButton.getAttribute("aria-label");
  expect(buttonLabel).toContain("Ver detalhes da linha");
});
