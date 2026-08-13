import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const cspScript = resolve(__dirname, '..', '..', 'scripts', 'apply-csp-origin.mjs');
const noindexScript = resolve(__dirname, '..', '..', 'scripts', 'apply-hml-noindex.mjs');
const verifyScript = resolve(__dirname, '..', '..', 'scripts', 'verify-hml-artifact.mjs');
const workerSource = readFileSync(resolve(__dirname, '..', '..', 'public', '_worker.js'), 'utf8');

const productionHtml = `<!doctype html>
<meta name="google-site-verification" content="test-only">
<meta name="robots" content="index, follow">
<meta http-equiv="Content-Security-Policy" content="connect-src 'self' https://api.internorotas.com wss://api.internorotas.com;">
<link rel="canonical" href="https://internorotas.com/">`;
const productionHeaders =
  "/*\n  Content-Security-Policy: connect-src 'self' https://api.internorotas.com wss://api.internorotas.com;\n";
const productionRobots = 'User-agent: *\nAllow: /\n';

let workDir: string;

function writeFixture() {
  writeFileSync(join(workDir, 'package.json'), '{"type":"module"}\n');
  mkdirSync(join(workDir, 'dist'), { recursive: true });
  writeFileSync(join(workDir, 'dist', 'index.html'), productionHtml);
  writeFileSync(join(workDir, 'dist', '_headers'), productionHeaders);
  writeFileSync(join(workDir, 'dist', 'robots.txt'), productionRobots);
  writeFileSync(join(workDir, 'dist', '_worker.js'), workerSource);
}

function run(script: string, args: string[] = [], env: Record<string, string | undefined> = {}) {
  return execFileSync('node', [script, ...args], {
    cwd: workDir,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'hml-artifact-'));
  writeFixture();
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe('artefato HML do frontend', () => {
  it('aplica noindex, CSP HML, robots.txt e Worker efetivo em fixture local', () => {
    run(cspScript, ['--hml'], { VITE_API_URL: 'https://api-hml.internorotas.com' });
    run(noindexScript, ['--hml']);
    expect(run(verifyScript)).toContain('verificados');

    const html = readFileSync(join(workDir, 'dist', 'index.html'), 'utf8');
    const headers = readFileSync(join(workDir, 'dist', '_headers'), 'utf8');
    const robots = readFileSync(join(workDir, 'dist', 'robots.txt'), 'utf8');
    const worker = readFileSync(join(workDir, 'dist', '_worker.js'), 'utf8');

    expect(html).toContain('noindex, nofollow, noarchive, nosnippet, noimageindex');
    expect(html).not.toContain('google-site-verification');
    expect(headers).toContain(
      'X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex',
    );
    expect(robots).toBe('User-agent: *\nDisallow: /\n');
    expect(worker).toContain('new Headers(response.headers)');
  });

  it('mantém o transformador HML e o Worker sem alteração quando executados no modo normal', () => {
    const before = ['index.html', '_headers', 'robots.txt', '_worker.js'].map((file) => [
      file,
      readFileSync(join(workDir, 'dist', file), 'utf8'),
    ]);

    run(noindexScript);

    for (const [file, content] of before) {
      expect(readFileSync(join(workDir, 'dist', file), 'utf8')).toBe(content);
    }
    expect(existsSync(join(workDir, 'dist', '_worker.js'))).toBe(true);
  });
});
