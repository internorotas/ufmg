#!/usr/bin/env node
// Busca a Secure Note do Bitwarden e grava o arquivo .env correspondente (gitignored).
//
// Pré-requisito:
//   npm install -g @bitwarden/cli
//   bw login
//   bw unlock  → copie o session token exibido
//   $env:BW_SESSION = "<token>"   (PowerShell)
//   export BW_SESSION="<token>"   (bash/zsh)
//
// Uso:
//   pnpm env:pull                    (baixa .env.local → dev)
//   pnpm env:pull:prod               (baixa .env.production.local → prod)
//   node scripts/load-env.mjs --env production
//
// Convenção de nomes das Secure Notes no Bitwarden:
//   dev:  "interno-rotas frontend .env.local"
//   prod: "interno-rotas frontend .env.production.local"
//
// Convenção de arquivos Vite (todos no .gitignore):
//   .env.local              → dev, sobrescreve .env e .env.development
//   .env.production.local   → build de produção

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const idx = process.argv.indexOf('--env');
const envTarget = idx !== -1 ? process.argv[idx + 1] : 'development';

const isProd = envTarget === 'production';
const ITEM_NAME = isProd
  ? 'interno-rotas frontend .env.production.local'
  : 'interno-rotas frontend .env.local';
const OUT_FILE = isProd ? '.env.production.local' : '.env.local';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', OUT_FILE);

function bw(cmd) {
  return execSync(`bw ${cmd}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] }).trim();
}

try {
  const items = JSON.parse(bw(`list items --search "${ITEM_NAME}"`));
  if (!items.length) {
    throw new Error(`Item "${ITEM_NAME}" não encontrado no Bitwarden.`);
  }

  const notes = bw(`get notes ${items[0].id}`);
  writeFileSync(OUT, notes, 'utf8');
  console.log(`✔ ${OUT_FILE} atualizado (${notes.length} bytes).`);
} catch (err) {
  console.error('Erro ao buscar segredos:', err.message);
  console.error('Verifique: bw CLI instalado, bw unlock executado, BW_SESSION definido.');
  process.exit(1);
}
