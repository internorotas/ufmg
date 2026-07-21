import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const distDir = resolve('dist');
const indexPath = resolve(distDir, 'index.html');

if (!existsSync(indexPath)) {
  throw new Error('dist/index.html não foi gerado.');
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

console.log(`Verificados ${visited.size} módulos e assets referenciados em dist/index.html.`);
