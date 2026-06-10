import { useEffect, useRef, useState } from 'react';

// v2: invalida cache v1 que continha rotas incorretas do OSRM
const CACHE_KEY_PREFIX = 'osrm_route_v2_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Se a linha já tem 30+ pontos, é rota real do banco (não apenas paradas).
// OSRM só é chamado para linhas com poucos pontos (só coordenadas de paradas).
const MIN_POINTS_FOR_REAL_ROUTE = 30;

interface OsrmCacheEntry {
  ts: number;
  data: [number, number][];
}

async function fetchOsrmRoute(stops: [number, number][]): Promise<[number, number][]> {
  // OSRM espera lng,lat na URL; Leaflet usa [lat, lng]
  const coordStr = stops.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);

  const json = (await res.json()) as {
    routes?: Array<{ geometry: { coordinates: [number, number][] } }>;
  };

  const coords = json.routes?.[0]?.geometry?.coordinates;
  if (!coords?.length) throw new Error('OSRM sem coordenadas');

  // GeoJSON retorna [lng, lat] — converter para [lat, lng] do Leaflet
  return coords.map(([lng, lat]) => [lat, lng]);
}

/**
 * Retorna coordenadas da rota para exibição no mapa.
 *
 * Se `fallbackCoords` já tem 30+ pontos, assume que são dados reais do banco
 * (rota completa mapeada) e os usa diretamente — sem chamar o OSRM.
 *
 * Se `fallbackCoords` são apenas paradas (poucos pontos), chama o OSRM para
 * snapping à malha viária. Cache 7 dias em localStorage.
 */
export function useOsrmRoute(
  lineId: string | undefined,
  fallbackCoords: [number, number][],
): [number, number][] {
  const [coords, setCoords] = useState<[number, number][]>(fallbackCoords);
  const pendingRef = useRef<string | null>(null);

  // Sincroniza fallback imediatamente quando a linha muda
  useEffect(() => {
    setCoords(fallbackCoords);
  }, [fallbackCoords]);

  useEffect(() => {
    if (!lineId || fallbackCoords.length < 2) return;

    // Rota real do banco: usa diretamente, sem OSRM
    if (fallbackCoords.length >= MIN_POINTS_FOR_REAL_ROUTE) {
      pendingRef.current = null;
      return;
    }

    if (pendingRef.current === lineId) return;
    pendingRef.current = lineId;

    const cacheKey = CACHE_KEY_PREFIX + lineId;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const entry = JSON.parse(raw) as OsrmCacheEntry;
        if (Date.now() - entry.ts < CACHE_TTL_MS && entry.data.length > 0) {
          setCoords(entry.data);
          return;
        }
      }
    } catch {
      // cache corrompido — ignora e busca novamente
    }

    fetchOsrmRoute(fallbackCoords)
      .then((snapped) => {
        setCoords(snapped);
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: snapped }));
      })
      .catch(() => {
        // OSRM falhou — mantém fallback (coordenadas das paradas)
      });
  }, [lineId, fallbackCoords]);

  return coords;
}
