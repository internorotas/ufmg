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
// Só transforma quando o comando informa explicitamente o modo HML — garante
// que um build de produção não seja afetado por uma chamada acidental.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const NOINDEX = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
const PROD_ROBOTS_CONTENT = 'index, follow';
const GOOGLE_VERIFY_PATTERN = /<meta\s+name="google-site-verification"[^>]*\/?\s*>/gi;

if (!process.argv.includes('--hml')) {
  process.stdout.write('apply-hml-noindex: sem --hml — nenhuma alteração.\n');
  process.exit(0);
}

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
if (!html.content.includes(PROD_ROBOTS_CONTENT) && !html.content.includes(NOINDEX)) {
  throw new Error(
    `apply-hml-noindex: dist/index.html não contém "${PROD_ROBOTS_CONTENT}" — ` +
      'a tag robots mudou de formato; atualize este script.',
  );
}
const newHtml = html.content
  .replace(`content="${PROD_ROBOTS_CONTENT}"`, `content="${NOINDEX}"`)
  .replace(GOOGLE_VERIFY_PATTERN, '');
writeFileSync(html.path, newHtml, 'utf8');
process.stdout.write(
  'apply-hml-noindex: dist/index.html — robots=noindex, google-site-verification removida.\n',
);

// 2. dist/_headers — adicionar X-Robots-Tag para /*
const headers = requireFile('_headers');
const robotsHeaderLine = `/*\n  X-Robots-Tag: ${NOINDEX}`;
if (headers.content.includes('X-Robots-Tag')) {
  process.stdout.write('apply-hml-noindex: dist/_headers — X-Robots-Tag já presente, ignorado.\n');
} else {
  // Prepend: deve aparecer antes de qualquer outra regra /*
  writeFileSync(headers.path, `${robotsHeaderLine}\n\n${headers.content}`, 'utf8');
  process.stdout.write('apply-hml-noindex: dist/_headers — X-Robots-Tag noindex adicionado.\n');
}

// 3. dist/robots.txt — substituir por versão que bloqueia tudo
const robotsTxtPath = resolve(distDir, 'robots.txt');
writeFileSync(robotsTxtPath, 'User-agent: *\nDisallow: /\n', 'utf8');
process.stdout.write('apply-hml-noindex: dist/robots.txt — Disallow: / aplicado.\n');

// 4. dist/_worker.js — proteger também respostas produzidas pelo Worker.
const worker = requireFile('_worker.js');
const workerMarker = 'HML_NOINDEX_WORKER';
if (!worker.content.includes(workerMarker)) {
  const responseReturn = '    return response;';
  const responseReturnCount = worker.content.split(responseReturn).length - 1;
  if (responseReturnCount !== 1) {
    throw new Error(
      'apply-hml-noindex: dist/_worker.js mudou; não foi possível localizar o retorno da resposta original.',
    );
  }

  let workerContent = worker.content.replace(
    responseReturn,
    [
      '    // HML_NOINDEX_WORKER: preserva status, corpo e headers da origem.',
      '    const headers = new Headers(response.headers);',
      `    headers.set('X-Robots-Tag', '${NOINDEX}');`,
      '    return new Response(response.body, {',
      '      status: response.status,',
      '      statusText: response.statusText,',
      '      headers,',
      '    });',
    ].join('\n'),
  );

  const fallbackContentType = "          'Content-Type': 'text/plain; charset=utf-8',";
  if (!workerContent.includes(fallbackContentType)) {
    throw new Error(
      'apply-hml-noindex: dist/_worker.js mudou; não foi possível proteger o fallback de asset.',
    );
  }
  workerContent = workerContent.replace(
    fallbackContentType,
    `${fallbackContentType}\n          'X-Robots-Tag': '${NOINDEX}',`,
  );
  writeFileSync(worker.path, workerContent, 'utf8');
  process.stdout.write('apply-hml-noindex: dist/_worker.js — X-Robots-Tag aplicado ao Worker.\n');
} else {
  process.stdout.write(
    'apply-hml-noindex: dist/_worker.js — X-Robots-Tag já presente, ignorado.\n',
  );
}
