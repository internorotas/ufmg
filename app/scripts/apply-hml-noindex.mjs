// apply-hml-noindex.mjs — transforma a saída de `vite build --mode hml` para
// impedir indexação por crawlers (GDPR/reputação — ambiente de homologação
// não deve ser indexado como produção).
//
// O que muda em dist/ (nunca nos arquivos fonte):
//   1. dist/index.html — troca robots "index, follow" por noindex completo
//                        e remove meta google-site-verification
//   2. dist/_headers   — adiciona X-Robots-Tag noindex para /* (PRIMEIRO, antes de outros)
//   3. dist/robots.txt — substitui por versão que bloqueia todos os crawlers
//
// No-op se VITE_MODE não for "hml" — garante que build de produção não seja afetado
// quando invocado acidentalmente fora do pipeline HML.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const NOINDEX = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
const PROD_ROBOTS_CONTENT = 'index, follow';
const GOOGLE_VERIFY_PATTERN = /<meta\s+name="google-site-verification"[^>]*\/?\s*>/gi;

const distDir = resolve('dist');

function requireFile(rel) {
  const p = resolve(distDir, rel);
  if (!existsSync(p)) {
    throw new Error(
      `apply-hml-noindex: ${rel} não existe — rode depois de \`vite build --mode hml\`.`,
    );
  }
  return { path: p, content: readFileSync(p, 'utf8') };
}

// 1. dist/index.html — substituir robots meta e remover google-site-verification
const html = requireFile('index.html');
if (!html.content.includes(PROD_ROBOTS_CONTENT)) {
  throw new Error(
    `apply-hml-noindex: dist/index.html não contém "${PROD_ROBOTS_CONTENT}" — ` +
      'a tag robots mudou de formato; atualize este script.',
  );
}
const newHtml = html.content
  .replace(`content="${PROD_ROBOTS_CONTENT}"`, `content="${NOINDEX}"`)
  .replace(GOOGLE_VERIFY_PATTERN, '');
writeFileSync(html.path, newHtml, 'utf8');
console.log(
  'apply-hml-noindex: dist/index.html — robots=noindex, google-site-verification removida.',
);

// 2. dist/_headers — adicionar X-Robots-Tag para /*
const headers = requireFile('_headers');
const robotsHeaderLine = `/*\n  X-Robots-Tag: ${NOINDEX}`;
if (headers.content.includes('X-Robots-Tag')) {
  console.log('apply-hml-noindex: dist/_headers — X-Robots-Tag já presente, ignorado.');
} else {
  // Prepend: deve aparecer antes de qualquer outra regra /*
  writeFileSync(headers.path, `${robotsHeaderLine}\n\n${headers.content}`, 'utf8');
  console.log('apply-hml-noindex: dist/_headers — X-Robots-Tag noindex adicionado.');
}

// 3. dist/robots.txt — substituir por versão que bloqueia tudo
const robotsTxtPath = resolve(distDir, 'robots.txt');
writeFileSync(robotsTxtPath, 'User-agent: *\nDisallow: /\n', 'utf8');
console.log('apply-hml-noindex: dist/robots.txt — Disallow: / aplicado.');
