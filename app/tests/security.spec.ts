/**
 * Suite: verificações de segurança E2E.
 * Confirma CSP, headers HTTP, ausência de tokens em URLs, e comportamento
 * seguro dos fluxos de autenticação.
 */
import { expect, test } from '@playwright/test';
import { BASE, mockAuthAnonymous, skipOnboarding } from './helpers';

test.beforeEach(async ({ page }) => {
  await skipOnboarding(page);
  await mockAuthAnonymous(page);
});

// ---------------------------------------------------------------------------
// Headers HTTP de segurança (dev server via Vite)
// Note: em produção o Vercel injeta os headers do vercel.json;
// aqui verificamos apenas que o app carrega sem erros críticos de CSP.
// ---------------------------------------------------------------------------

test('security – app carrega sem erros JavaScript na console', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');

  // Filtra erros conhecidos e inofensivos (ex: extensões de browser)
  const realErrors = errors.filter(
    (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
  );
  expect(realErrors).toHaveLength(0);
});

test('security – nenhum token JWT exposto em URL após navegação', async ({ page }) => {
  // Monitora todas as URLs visitadas durante a sessão
  const visitedUrls: string[] = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) visitedUrls.push(frame.url());
  });

  await page.goto(`${BASE}/`);
  await page.goto(`${BASE}/login`);
  await page.goto(`${BASE}/linhas`);
  await page.goto(`${BASE}/ranking`);
  await page.goto(`${BASE}/mais`);

  for (const url of visitedUrls) {
    expect(url).not.toMatch(/[?&](token|access_token|jwt|auth_token|id_token|credential)=/i);
  }
});

test('security – rota protegida /perfil não expõe dados sem auth', async ({ page }) => {
  await page.goto(`${BASE}/perfil`);
  // Deve redirecionar para home; nunca renderizar conteúdo de perfil
  await expect(page).toHaveURL(new RegExp(`${BASE}/?$`), { timeout: 8_000 });
  // Página de perfil não deve ter dados sensíveis visíveis
  await expect(page.getByText(/excluir conta/i)).not.toBeVisible({ timeout: 3_000 });
});

test('security – service worker (quando registrado) esta no escopo correto', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2_000);

  const swScopes: string[] = await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    return regs.map((r) => r.scope);
  });

  // Em dev (Vite) o SW pode nao estar registrado; verificamos apenas
  // que, caso exista, o escopo nao aponta para dominio externo.
  for (const scope of swScopes) {
    expect(scope).not.toBe('https://accounts.google.com/');
    expect(scope).not.toContain('attacker');
    expect(scope).toMatch(/^http:\/\/127\.0\.0\.1/);
  }
});

test('security – meta CSP presente sem unsafe-inline em script-src', async ({ page }) => {
  await page.goto(`${BASE}/`);

  const cspContent = await page.evaluate(() => {
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    return meta?.getAttribute('content') ?? '';
  });

  // CSP meta deve existir
  expect(cspContent.length).toBeGreaterThan(0);

  // script-src NÃO deve ter unsafe-inline (fix aplicado)
  const scriptSrcMatch = cspContent.match(/script-src ([^;]+)/);
  if (scriptSrcMatch) {
    expect(scriptSrcMatch[1]).not.toContain("'unsafe-inline'");
  }

  // object-src deve bloquear plugins
  expect(cspContent).toContain("object-src 'none'");

  // base-uri deve estar restrito
  expect(cspContent).toContain("base-uri 'self'");
});

test('security – sem credentials em query params de API calls', async ({ page }) => {
  const suspiciousRequests: string[] = [];

  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/v1/') && /[?&](token|password|secret|key|auth)=/i.test(url)) {
      suspiciousRequests.push(url);
    }
  });

  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');

  expect(suspiciousRequests).toHaveLength(0);
});

test('security – Authorization header não aparece em requests para domínios terceiros', async ({
  page,
}) => {
  const leakedAuthRequests: string[] = [];

  page.on('request', (req) => {
    const authHeader = req.headers()['authorization'];
    const url = req.url();
    // Qualquer request com Auth que não seja para a API do projeto
    if (
      authHeader &&
      !url.includes('api.internorotas.com') &&
      !url.includes('localhost') &&
      !url.includes('127.0.0.1')
    ) {
      leakedAuthRequests.push(url);
    }
  });

  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');

  expect(leakedAuthRequests).toHaveLength(0);
});

test('security – push subscription endpoint não é enviado a domínio externo', async ({ page }) => {
  const suspiciousPushRequests: string[] = [];

  page.on('request', (req) => {
    const url = req.url();
    const body = req.postData() ?? '';
    // Se um request POST inclui "endpoint" no body indo para fora da API
    if (
      req.method() === 'POST' &&
      body.includes('"endpoint"') &&
      !url.includes('api.internorotas.com') &&
      !url.includes('localhost') &&
      !url.includes('127.0.0.1')
    ) {
      suspiciousPushRequests.push(url);
    }
  });

  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');

  expect(suspiciousPushRequests).toHaveLength(0);
});

test('security – localStorage não contém tokens JWT em plaintext', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');

  const storageContents: Record<string, string> = await page.evaluate(() => {
    const items: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      items[key] = localStorage.getItem(key) ?? '';
    }
    return items;
  });

  // Nenhuma chave deve guardar token JWT plaintext
  for (const [key, value] of Object.entries(storageContents)) {
    // JWT tem formato xxxxx.yyyyy.zzzzz
    expect(value, `localStorage["${key}"] contém JWT exposto`).not.toMatch(
      /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
    );
  }
});

test('security – sessionStorage GPS não vaza dados após fim de sessão', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');

  // Sem iniciar rastreio, não deve haver dados GPS na sessionStorage
  const gpsData = await page.evaluate(() => {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)!;
      if (key.includes('gps')) return sessionStorage.getItem(key);
    }
    return null;
  });

  expect(gpsData).toBeNull();
});
