import { useEffect, useRef, useState } from 'react';

const CACHE_KEY_PREFIX = 'osrm_route_v1_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
 * Retorna as coordenadas da rota snapped à malha viária via OSRM.
 * Enquanto aguarda a resposta usa `fallbackCoords` (pontos das paradas).
 * Cache em localStorage por 7 dias por linha.
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
