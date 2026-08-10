// Reescreve o domínio da API na Content-Security-Policy do build gerado
// (dist/index.html + dist/_headers), a partir de VITE_API_URL — nunca edita
// os arquivos-fonte versionados (index.html/public/_headers continuam
// declarando o domínio de PRODUÇÃO como default; este script só transforma a
// SAÍDA do build de um ambiente específico, ex.: HML).
//
// Roda sempre, em todo `pnpm build` (produção inclusive): quando VITE_API_URL
// é omitida ou é exatamente o domínio de produção, o script é NO-OP (nenhuma
// substring é encontrada para trocar por um valor diferente do já presente,
// então o `replaceAll` não altera nada) — build de produção continua
// byte-idêntico ao de antes deste script existir.
//
// Uso: node scripts/apply-csp-origin.mjs (depois de `vite build`, antes de
// verify-dist-assets.mjs).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PRODUCTION_API_URL = 'https://api.internorotas.com';
const PRODUCTION_HTTP_ORIGIN = PRODUCTION_API_URL;
const PRODUCTION_WS_ORIGIN = PRODUCTION_API_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');

const distDir = resolve('dist');
const targets = [
  { path: resolve(distDir, 'index.html'), label: 'dist/index.html' },
  { path: resolve(distDir, '_headers'), label: 'dist/_headers' },
];

function toWsOrigin(httpOrigin) {
  return httpOrigin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
}

const apiUrl = (process.env.VITE_API_URL ?? PRODUCTION_API_URL).replace(/\/+$/, '');
const httpOrigin = apiUrl;
const wsOrigin = toWsOrigin(apiUrl);

const productionPair = `${PRODUCTION_HTTP_ORIGIN} ${PRODUCTION_WS_ORIGIN}`;
const targetPair = `${httpOrigin} ${wsOrigin}`;

if (productionPair === targetPair) {
  console.log('apply-csp-origin: VITE_API_URL é o domínio de produção — nenhuma alteração.');
  process.exit(0);
}

let changedFiles = 0;
for (const target of targets) {
  if (!existsSync(target.path)) {
    throw new Error(`${target.label} não foi gerado — rode depois de \`vite build\`.`);
  }

  const source = readFileSync(target.path, 'utf8');
  if (!source.includes(productionPair)) {
    throw new Error(
      `${target.label} não contém "${productionPair}" — a CSP mudou de formato e este script precisa ser atualizado junto (nunca falhar silenciosamente deixando o domínio de produção na CSP de outro ambiente).`,
    );
  }

  writeFileSync(target.path, source.replaceAll(productionPair, targetPair));
  changedFiles += 1;
}

console.log(
  `apply-csp-origin: CSP de ${changedFiles} arquivo(s) atualizada para ${httpOrigin} (${wsOrigin}).`,
);
