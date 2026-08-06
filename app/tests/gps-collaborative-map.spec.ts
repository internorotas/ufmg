/**
 * Suite: mapa colaborativo — GPS ao vivo em lote (GET /v1/gps/live).
 *
 * Sem backend/DB real disponível neste ambiente (ver limitação documentada
 * na auditoria), este teste mocka o contrato HTTP do backend (schema real de
 * GpsLiveBatchItem, ver backend/src/gps/gps-live.service.ts) e valida o
 * comportamento real do frontend: dois contexts de navegador INDEPENDENTES
 * (sem estado/sessão compartilhados) veem o mesmo ônibus ao vivo no mapa sem
 * que nenhum deles precise selecionar a linha — o contrato central da Seção 5.
 * A agregação de GPS por linha (múltiplos contribuidores → posição ponderada)
 * já é coberta pelos testes de unidade do backend (gps-live.service.spec.ts).
 *
 * O app carrega as linhas de dados estáticos bundlados (ofuscados via XOR,
 * ver src/lib/dataCodec.ts), não de uma chamada de rede — por isso este teste
 * decodifica esses dados para descobrir um idRota real em vez de inventar um.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { BASE, mockAuthAnonymous, skipOnboarding, waitForMap } from './helpers';

// Espelha src/lib/dataCodec.ts — só para introspecção em tempo de teste.
const XOR_KEY = new Uint8Array([
  0x49, 0x4e, 0x54, 0x45, 0x52, 0x4e, 0x4f, 0x2d, 0x52, 0x4f, 0x54, 0x41, 0x53, 0x2d, 0x32, 0x30,
  0x32, 0x34, 0x2d, 0x56, 0x31, 0x00, 0xff, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc,
]);

interface SampleLinha {
  idRota: string;
}

const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));

function decodeFirstLinha(): SampleLinha {
  const filePath = path.join(TESTS_DIR, '..', 'src', 'data', 'linhas.ts');
  const source = readFileSync(filePath, 'utf8');
  const match = source.match(/const encoded =\s*\n?\s*'([^']+)'/);
  if (!match) throw new Error('Não foi possível localizar os dados ofuscados em linhas.ts');

  const encrypted = Buffer.from(match[1], 'base64');
  const decrypted = Buffer.alloc(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ XOR_KEY[i % XOR_KEY.length];
  }

  const data = JSON.parse(decrypted.toString('utf8')) as {
    categoriasDias: Array<{ linhas: SampleLinha[] }>;
  };
  const primeiraLinha = data.categoriasDias[0]?.linhas[0];
  if (!primeiraLinha) throw new Error('Dados de linhas bundlados estão vazios');
  return primeiraLinha;
}

const LINHA_TESTE = decodeFirstLinha();

async function mockLiveGpsBatch(context: BrowserContext): Promise<void> {
  await context.route('**/v1/gps/live', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          linhaId: LINHA_TESTE.idRota,
          lat: -19.8715,
          lng: -43.9679,
          heading: 90,
          confidence: 0.9,
          updatedAt: new Date().toISOString(),
          delayed: false,
          vehicleKey: 'e2e-vehicle-key-1',
        },
      ]),
    }),
  );
}

async function expectLiveBusVisibleWithoutSelectingLine(page: Page): Promise<void> {
  await mockAuthAnonymous(page);
  await skipOnboarding(page);
  await page.goto(`${BASE}/`);
  await waitForMap(page);

  // Nunca seleciona/abre a linha — o marcador precisa aparecer só pelo lote.
  await expect(page.getByTestId('gps-live-batch-badge')).toBeVisible({ timeout: 15_000 });
}

test('mapa colaborativo — dois contexts independentes veem o mesmo ônibus ao vivo sem selecionar a linha', async ({
  browser,
}) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  try {
    await mockLiveGpsBatch(contextA);
    await mockLiveGpsBatch(contextB);

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Contexts sem estado/sessão compartilhado — cada um enxerga o ônibus
    // apenas porque o "servidor" (mockado) devolve o mesmo lote a qualquer
    // cliente, nunca por vazamento de cache/singleton entre abas.
    await expectLiveBusVisibleWithoutSelectingLine(pageA);
    await expectLiveBusVisibleWithoutSelectingLine(pageB);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
