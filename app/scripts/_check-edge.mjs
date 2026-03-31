import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'msedge' }).catch((_e) => null);
if (browser) {
  await browser.close();
} else {
  // Falha ao iniciar o Edge
}
