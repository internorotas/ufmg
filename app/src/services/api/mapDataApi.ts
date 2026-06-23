import { resolveApiEndpoint } from '@/services/api/apiClient';

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface GeoJsonFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

// BASE_URL inclui o basePath do tenant (ex: '/ufmg/') — necessário para Vite public assets
const LOCAL_FALLBACK_URL = `${import.meta.env.BASE_URL}data/ufmg-predios.geojson`;

function ensureFeatureCollection(value: unknown): GeoJsonFeatureCollection {
  if (
    value &&
    typeof value === 'object' &&
    (value as GeoJsonFeatureCollection).type === 'FeatureCollection' &&
    Array.isArray((value as GeoJsonFeatureCollection).features)
  ) {
    return value as GeoJsonFeatureCollection;
  }
  throw new Error('Resposta invalida para ufmg-predios');
}

async function fetchWithTimeout(url: string, timeoutMs = 10_000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchUfmPredios(): Promise<GeoJsonFeatureCollection> {
  try {
    const endpoint = resolveApiEndpoint('/v1/map/ufmg-predios');
    const response = await fetchWithTimeout(endpoint);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    return ensureFeatureCollection(payload);
  } catch {
    // Backend indisponivel — fallback para arquivo estatico
  }

  try {
    const response = await fetchWithTimeout(LOCAL_FALLBACK_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    return ensureFeatureCollection(payload);
  } catch {
    // Ambas as fontes indisponiveis — retorna vazio
    return { type: 'FeatureCollection', features: [] };
  }
}
