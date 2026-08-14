import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootPackagePath = resolve(frontendRoot, 'package.json');
const appPackagePath = resolve(frontendRoot, 'app', 'package.json');
const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
const appPackage = JSON.parse(readFileSync(appPackagePath, 'utf8'));
const rootBuild = rootPackage.scripts?.build;

if (rootBuild === 'pnpm run build' || /\bpnpm\s+run\s+build\b/.test(rootBuild ?? '')) {
  throw new Error(
    'O build da raiz do frontend é recursivo; delegue explicitamente para `pnpm --dir app run build`.',
  );
}

if (!/\bpnpm\s+--dir\s+app\s+run\s+build\b/.test(rootBuild ?? '')) {
  throw new Error('O build da raiz do frontend deve delegar para app/.');
}

if (typeof appPackage.scripts?.build !== 'string' || appPackage.scripts.build.length === 0) {
  throw new Error('app/package.json não possui um script build executável.');
}

process.stdout.write('verify-root-build-script: frontend/ delega o build para app/.\n');
