import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const NOINDEX = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
const HML_API_URL = 'https://api-hml.internorotas.com';
const HML_WS_URL = 'wss://api-hml.internorotas.com';
const distDir = resolve('dist');

function readDistFile(name) {
  const path = resolve(distDir, name);
  if (!existsSync(path)) throw new Error(`Artefato HML ausente: dist/${name}`);
  return { path, content: readFileSync(path, 'utf8') };
}

const html = readDistFile('index.html').content;
const headers = readDistFile('_headers').content;
const robots = readDistFile('robots.txt').content;
const worker = readDistFile('_worker.js');

if (!html.includes(`content="${NOINDEX}"`)) {
  throw new Error('Artefato HML não contém meta robots noindex completo.');
}
if (html.includes('google-site-verification')) {
  throw new Error('Artefato HML ainda contém google-site-verification.');
}
if (!html.includes(HML_API_URL) || !html.includes(HML_WS_URL)) {
  throw new Error('CSP do HTML HML não contém as origens de API e WebSocket HML.');
}
if (!html.includes('https://internorotas.com/')) {
  throw new Error('Artefato HML perdeu o canonical público esperado.');
}
if (!headers.includes(`X-Robots-Tag: ${NOINDEX}`)) {
  throw new Error('dist/_headers não contém X-Robots-Tag noindex.');
}
if (!headers.includes(HML_API_URL) || !headers.includes(HML_WS_URL)) {
  throw new Error('CSP de dist/_headers não contém as origens HML.');
}
if (robots.trim() !== 'User-agent: *\nDisallow: /') {
  throw new Error('robots.txt HML não bloqueia todos os crawlers.');
}
if (
  !worker.content.includes('new Headers(response.headers)') ||
  !worker.content.includes('status: response.status') ||
  !worker.content.includes('statusText: response.statusText') ||
  !worker.content.includes('new Response(response.body') ||
  !worker.content.includes(`X-Robots-Tag', '${NOINDEX}'`)
) {
  throw new Error('dist/_worker.js não preserva a resposta ao aplicar X-Robots-Tag.');
}

const { default: workerModule } = await import(pathToFileURL(worker.path).href);
const originResponse = await workerModule.fetch(new Request('https://hml.internorotas.com/'), {
  ASSETS: {
    fetch: async () =>
      new Response('fixture', {
        status: 201,
        statusText: 'Created',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Fixture-Header': 'preserved',
        },
      }),
  },
});

if (
  originResponse.status !== 201 ||
  originResponse.statusText !== 'Created' ||
  originResponse.headers.get('x-fixture-header') !== 'preserved' ||
  originResponse.headers.get('x-robots-tag') !== NOINDEX
) {
  throw new Error('Resposta efetiva do Worker HML não preservou status/headers ou noindex.');
}

const missingAssetResponse = await workerModule.fetch(
  new Request('https://hml.internorotas.com/assets/ausente.js'),
  {
    ASSETS: {
      fetch: async () =>
        new Response('<!doctype html>', {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
    },
  },
);

if (
  missingAssetResponse.status !== 404 ||
  missingAssetResponse.headers.get('cache-control') !== 'no-store' ||
  missingAssetResponse.headers.get('x-robots-tag') !== NOINDEX
) {
  throw new Error('Worker HML perdeu o fallback 404 seguro de assets.');
}

console.log('verify-hml-artifact: HTML, headers, robots.txt e Worker HML verificados.');
