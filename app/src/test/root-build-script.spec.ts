import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const frontendRoot = resolve(__dirname, '..', '..', '..');
const rootPackagePath = resolve(frontendRoot, 'package.json');
const rootBuildGuard = resolve(frontendRoot, 'scripts', 'verify-root-build-script.mjs');

describe('build da raiz do frontend', () => {
  it('delega para app/ e não chama pnpm run build recursivamente', () => {
    const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
    const build = rootPackage.scripts?.build as string;

    expect(build).toContain('pnpm --dir app run build');
    expect(build).not.toBe('pnpm run build');
    expect(build).not.toMatch(/\bpnpm\s+run\s+build\b/);
    expect(execFileSync('node', [rootBuildGuard], { encoding: 'utf8' })).toContain('delega');
  });
});
