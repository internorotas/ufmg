import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:43173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 43173',
    url: 'http://127.0.0.1:43173/ufmg/',
    reuseExistingServer: true,
    timeout: 120_000,
    // Sem isso, o dev server serve em basePath '/' (padrão de vite.config.ts)
    // enquanto os testes assumem app montado em /ufmg/ (BASE em tests/helpers.ts) —
    // React Router usa import.meta.env.BASE_URL como basename, então navegar para
    // /ufmg/perfil não casava com nenhuma rota e redirecionava para "/", não "/ufmg/".
    env: { VITE_BASE_PATH: '/ufmg/' },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
