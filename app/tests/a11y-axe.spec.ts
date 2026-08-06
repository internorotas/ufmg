import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { BASE, mockAuthAnonymous, skipOnboarding } from './helpers';

// Varredura axe-core dos fluxos principais. Falha em violações "critical"/
// "serious" — "moderate"/"minor" só são reportadas (evita travar o CI por
// achados de baixo risco que precisam de triagem manual, mas nunca esconde
// os graves).
function assertNoSeriousViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
) {
  const serious = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  if (serious.length > 0) {
    const details = serious
      .map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} ocorrência(s)`)
      .join('\n');
    throw new Error(`Violações axe critical/serious encontradas:\n${details}`);
  }
}

test('home/mapa sem violações axe critical/serious', async ({ page }) => {
  await skipOnboarding(page);
  await mockAuthAnonymous(page);

  await page.goto(`${BASE}/`);
  await expect(page).toHaveTitle(/Interno Rotas/);
  await page.waitForTimeout(1_000);

  const results = await new AxeBuilder({ page }).analyze();
  assertNoSeriousViolations(results.violations);
});

test('página Sobre sem violações axe critical/serious', async ({ page }) => {
  await skipOnboarding(page);
  await mockAuthAnonymous(page);

  await page.goto(`${BASE}/sobre`);
  await page.waitForTimeout(500);

  const results = await new AxeBuilder({ page }).analyze();
  assertNoSeriousViolations(results.violations);
});
