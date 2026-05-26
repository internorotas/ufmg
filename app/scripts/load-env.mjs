#!/usr/bin/env node
// Baixa .env.production do Bitwarden e salva localmente (gitignored).
//
// Pré-requisito:
//   npm install -g @bitwarden/cli
//   bw login
//   bw unlock  → copie o session token exibido
//   $env:BW_SESSION = "<token>"   (PowerShell)
//   export BW_SESSION="<token>"   (bash/zsh)
//
// Uso:
//   pnpm env:pull

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ITEM_NAME = 'interno-rotas frontend .env.production';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '.env.production');

function bw(cmd) {
  return execSync(`bw ${cmd}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] }).trim();
}

try {
  const items = JSON.parse(bw(`list items --search "${ITEM_NAME}"`));
  if (!items.length) throw new Error(`"${ITEM_NAME}" não encontrado no Bitwarden.`);

  const notes = bw(`get notes ${items[0].id}`);
  writeFileSync(OUT, notes, 'utf8');
  process.stdout.write(`✔ .env.production atualizado (${notes.length} bytes)\n`);
} catch (err) {
  process.stderr.write(`Erro: ${err.message}\n`);
  process.stderr.write('Verifique: bw instalado, bw unlock executado, BW_SESSION definido.\n');
  process.exit(1);
}
