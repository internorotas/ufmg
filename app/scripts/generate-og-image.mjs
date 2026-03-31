/**
 * Gera a og-image.png para preview em redes sociais.
 * Requer que os browsers do Playwright estejam instalados:
 *   pnpm exec playwright install chromium
 *
 * Uso:
 *   node scripts/generate-og-image.mjs
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
const outputPath = path.resolve(publicDir, 'og-image.png');

const iconSvg = readFileSync(path.join(publicDir, 'logo_Icone.svg'), 'utf-8');
const iconBase64 = Buffer.from(iconSvg).toString('base64');
const iconDataUrl = `data:image/svg+xml;base64,${iconBase64}`;

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800;900&display=block" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 630px;
      background: #2C0EEB;
      font-family: 'Poppins', system-ui, -apple-system, sans-serif;
      overflow: hidden;
    }
    .container {
      display: flex;
      align-items: center;
      padding: 64px 80px;
      width: 1200px;
      height: 630px;
      gap: 56px;
      position: relative;
    }
    /* Decorative circles */
    .container::before {
      content: '';
      position: absolute;
      width: 480px;
      height: 480px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
      right: 180px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
    }
    .container::after {
      content: '';
      position: absolute;
      width: 320px;
      height: 320px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
      right: 88px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
    }
    .text-area {
      flex: 1;
      z-index: 1;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      background: rgba(236, 220, 196, 0.15);
      border: 1.5px solid rgba(236, 220, 196, 0.35);
      border-radius: 100px;
      padding: 7px 20px;
      margin-bottom: 28px;
    }
    .badge-text {
      color: #ECDCC4;
      font-size: 19px;
      font-weight: 600;
      letter-spacing: 0.04em;
    }
    .title {
      color: #ECDCC4;
      font-size: 88px;
      font-weight: 900;
      line-height: 0.95;
      margin-bottom: 24px;
      letter-spacing: -0.03em;
    }
    .subtitle {
      color: rgba(236, 220, 196, 0.75);
      font-size: 27px;
      font-weight: 400;
      line-height: 1.4;
      margin-bottom: 44px;
      max-width: 520px;
    }
    .url {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: rgba(236, 220, 196, 0.5);
      font-size: 19px;
      font-weight: 400;
      border-top: 1px solid rgba(236, 220, 196, 0.15);
      padding-top: 24px;
      width: 100%;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(236, 220, 196, 0.35);
      flex-shrink: 0;
    }
    .icon-area {
      width: 260px;
      height: 260px;
      flex-shrink: 0;
      z-index: 1;
    }
    .icon-area img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="text-area">
      <div class="badge">
        <span class="badge-text">UFMG &nbsp;·&nbsp; Campus Pampulha</span>
      </div>
      <h1 class="title">Interno<br>Rotas</h1>
      <p class="subtitle">Mapa interativo e horários dos ônibus internos em tempo real</p>
      <div class="url">
        <span class="dot"></span>
        internorotas.github.io/ufmg
      </div>
    </div>
    <div class="icon-area">
      <img src="${iconDataUrl}" alt="">
    </div>
  </div>
</body>
</html>`;

// Tenta Edge (pré-instalado no Windows) antes de tentar baixar Chromium
const browser = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch());
const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

await page.screenshot({
  path: outputPath,
  type: 'png',
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});

await browser.close();
