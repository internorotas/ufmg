const OSRM_CACHE_KEY_PREFIX = 'osrm_route_v2_';
const OSRM_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Memo em processo: o cache OSRM no localStorage muda raramente (TTL de 7 dias,
// escrito só quando uma rota é buscada). Os hooks de posição do ônibus liam
// localStorage + JSON.parse por linha a cada tick (1–5s), causando jank em
// dispositivos modestos com muitas linhas ativas. Reusa o parse por até 30s.
const MEMO_TTL_MS = 30_000;
const memo = new Map<string, { at: number; value: [number, number][] | null }>();

/**
 * Lê a rota OSRM cacheada de uma linha (localStorage), com memo em memória.
 * Retorna null se ausente, expirada ou inválida.
 */
export function lerOsrmCache(lineId: string): [number, number][] | null {
  const cached = memo.get(lineId);
  if (cached && Date.now() - cached.at < MEMO_TTL_MS) {
    return cached.value;
  }

  let value: [number, number][] | null = null;
  try {
    const raw = localStorage.getItem(OSRM_CACHE_KEY_PREFIX + lineId);
    if (raw) {
      const entry = JSON.parse(raw) as { ts: number; data: [number, number][] };
      if (Date.now() - entry.ts < OSRM_CACHE_TTL_MS && entry.data.length > 0) {
        value = entry.data;
      }
    }
  } catch {}

  memo.set(lineId, { at: Date.now(), value });
  return value;
}
