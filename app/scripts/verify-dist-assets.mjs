import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const distDir = resolve('dist');
const indexPath = resolve(distDir, 'index.html');
const workerPath = resolve(distDir, '_worker.js');

if (!existsSync(indexPath)) {
  throw new Error('dist/index.html não foi gerado.');
}

if (!existsSync(workerPath)) {
  throw new Error('dist/_worker.js não foi gerado.');
}

const missing = new Set();
const visited = new Set();

function checkAsset(assetPath) {
  const normalizedPath = assetPath.replace(/^\//, '');
  const absolutePath = resolve(distDir, normalizedPath);
  if (!existsSync(absolutePath)) {
    missing.add(normalizedPath);
    return;
  }

  if (!normalizedPath.endsWith('.js') || visited.has(absolutePath)) return;
  visited.add(absolutePath);

  const source = readFileSync(absolutePath, 'utf8');
  for (const match of source.matchAll(/(?:from\s*|import\s*\()['"](\.\.?\/[^'"]+)['"]/g)) {
    const importedPath = resolve(dirname(absolutePath), match[1]);
    if (!existsSync(importedPath)) {
      missing.add(importedPath.slice(distDir.length + 1).replaceAll('\\', '/'));
      continue;
    }

    checkAsset(importedPath.slice(distDir.length + 1).replaceAll('\\', '/'));
  }
}

const html = readFileSync(indexPath, 'utf8');
for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) {
  checkAsset(match[1]);
}

if (missing.size > 0) {
  throw new Error(`Assets ausentes no build: ${[...missing].sort().join(', ')}`);
}

const { default: worker } = await import(pathToFileURL(workerPath).href);
const fallbackResponse = await worker.fetch(new Request('https://internorotas.com/assets/ausente.js'), {
  ASSETS: {
    fetch: async () =>
      new Response('<!doctype html>', { headers: { 'content-type': 'text/html; charset=utf-8' } }),
  },
});

if (
  fallbackResponse.status !== 404 ||
  fallbackResponse.headers.get('cache-control') !== 'no-store' ||
  !fallbackResponse.headers.get('content-type')?.startsWith('text/plain')
) {
  throw new Error('dist/_worker.js não protege assets ausentes contra fallback HTML.');
}

console.log(`Verificados ${visited.size} módulos/assets e o Worker do Cloudflare Pages.`);
