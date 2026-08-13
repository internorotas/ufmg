import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// scripts/apply-csp-origin.mjs roda em CI/build (fora do include do vitest,
// que só cobre src/**), então este teste sobe o script de verdade via
// child_process contra um dist/ fixture, num diretório temporário — nunca
// contra o dist/ real do repo, nunca modifica os arquivos-fonte versionados
// (index.html/public/_headers).
const SCRIPT_PATH = resolve(__dirname, '..', '..', 'scripts', 'apply-csp-origin.mjs');

const PRODUCTION_SNIPPET =
  "connect-src 'self' https://api.internorotas.com wss://api.internorotas.com https://accounts.google.com;";

let workDir: string;

function writeFixture(content: string) {
  writeFileSync(join(workDir, 'dist', 'index.html'), content);
  writeFileSync(join(workDir, 'dist', '_headers'), content);
}

function runScript(env: Record<string, string | undefined> = {}) {
  return execFileSync('node', [SCRIPT_PATH], {
    cwd: workDir,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'apply-csp-origin-'));
  mkdirSync(join(workDir, 'dist'), { recursive: true });
  writeFixture(`<html><head><meta content="${PRODUCTION_SNIPPET}"></head></html>`);
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe('scripts/apply-csp-origin.mjs', () => {
  it('é no-op quando VITE_API_URL está ausente (default é o domínio de produção)', () => {
    const before = readFileSync(join(workDir, 'dist', 'index.html'), 'utf8');
    runScript({ VITE_API_URL: undefined });
    const after = readFileSync(join(workDir, 'dist', 'index.html'), 'utf8');

    expect(after).toBe(before);
  });

  it('é no-op quando VITE_API_URL é exatamente o domínio de produção', () => {
    const before = readFileSync(join(workDir, 'dist', 'index.html'), 'utf8');
    runScript({ VITE_API_URL: 'https://api.internorotas.com' });
    const after = readFileSync(join(workDir, 'dist', 'index.html'), 'utf8');

    expect(after).toBe(before);
  });

  it('reescreve http(s) e wss em index.html e _headers para o domínio de HML', () => {
    runScript({ VITE_API_URL: 'https://api-hml.internorotas.com' });

    for (const file of ['index.html', '_headers']) {
      const content = readFileSync(join(workDir, 'dist', file), 'utf8');
      expect(content).toContain('https://api-hml.internorotas.com wss://api-hml.internorotas.com');
      expect(content).not.toContain('https://api.internorotas.com wss://api.internorotas.com');
      // Resto da CSP (domínios de terceiros) permanece intacto.
      expect(content).toContain('https://accounts.google.com');
    }
  });

  it('normaliza barra final em VITE_API_URL', () => {
    runScript({ VITE_API_URL: 'https://api-hml.internorotas.com/' });

    const content = readFileSync(join(workDir, 'dist', 'index.html'), 'utf8');
    expect(content).toContain('https://api-hml.internorotas.com wss://api-hml.internorotas.com');
  });

  it('suporta http:// local (dev/teste manual) convertendo para ws://', () => {
    runScript({ VITE_API_URL: 'http://localhost:43112' });

    const content = readFileSync(join(workDir, 'dist', 'index.html'), 'utf8');
    expect(content).toContain('http://localhost:43112 ws://localhost:43112');
  });

  it('falha (nunca silenciosamente) se a CSP de produção não for encontrada — formato mudou e o script precisa acompanhar', () => {
    writeFixture('<html><head></head></html>');

    expect(() => runScript({ VITE_API_URL: 'https://api-hml.internorotas.com' })).toThrow();
  });

  it('falha se dist/index.html não existir', () => {
    rmSync(join(workDir, 'dist', 'index.html'));

    expect(() => runScript({ VITE_API_URL: 'https://api-hml.internorotas.com' })).toThrow();
  });
});
