import { resolveApiEndpoint, withTenantHeaders } from './apiClient';
import { getCurrentTransitToken } from './transitApi';

export interface GtfsRoute {
  route_id: string;
  short_name?: string;
  long_name: string;
  route_type: number;
  route_color?: string;
  route_text_color?: string;
}

export interface GtfsStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  zone_id?: string;
}

export interface GtfsShape {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
  shape_dist_traveled?: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const routesCache = new Map<string, { data: GtfsRoute[]; expires: number }>();
const stopsCache = new Map<string, { data: GtfsStop[]; expires: number }>();
const shapesCache = new Map<string, { data: GtfsShape[]; expires: number }>();

export async function fetchGtfsRoutes(): Promise<GtfsRoute[]> {
  const cached = routesCache.get('all');
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  const endpoint = resolveApiEndpoint('/api/gtfs/routes');
  const token = getCurrentTransitToken();
  const headers = withTenantHeaders({ ...(token ? { 'X-Transit-Token': token } : {}) });
  const response = await fetch(endpoint, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status} em ${endpoint}`);
  }

  const data = (await response.json()) as GtfsRoute[];
  routesCache.set('all', { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

export async function fetchGtfsStops(routeId: string): Promise<GtfsStop[]> {
  const cached = stopsCache.get(routeId);
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  const endpoint = resolveApiEndpoint(`/api/gtfs/routes/${routeId}/stops`);
  const token = getCurrentTransitToken();
  const headers = withTenantHeaders({ ...(token ? { 'X-Transit-Token': token } : {}) });
  const response = await fetch(endpoint, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status} em ${endpoint}`);
  }

  const data = (await response.json()) as GtfsStop[];
  stopsCache.set(routeId, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

export async function fetchGtfsShape(routeId: string): Promise<GtfsShape[]> {
  const cached = shapesCache.get(routeId);
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  const endpoint = resolveApiEndpoint(`/api/gtfs/routes/${routeId}/shape`);
  const token = getCurrentTransitToken();
  const headers = withTenantHeaders({ ...(token ? { 'X-Transit-Token': token } : {}) });
  const response = await fetch(endpoint, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status} em ${endpoint}`);
  }

  const raw = (await response.json()) as unknown;

  // Backend retorna FeatureCollection RFC 7946 com LineString ([lng, lat])
  const fc = raw as {
    type?: string;
    features?: Array<{ geometry?: { type?: string; coordinates?: number[][] } }>;
  };
  let data: GtfsShape[];
  if (fc.type === 'FeatureCollection' && Array.isArray(fc.features)) {
    const coords = fc.features[0]?.geometry?.coordinates ?? [];
    data = coords.map(([lng, lat], i) => ({
      shape_id: routeId,
      shape_pt_lat: lat ?? 0,
      shape_pt_lon: lng ?? 0,
      shape_pt_sequence: i,
    }));
  } else {
    // fallback: formato legado de array de pontos
    data = raw as GtfsShape[];
  }

  shapesCache.set(routeId, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

export async function searchGtfsStops(query: string): Promise<GtfsStop[]> {
  const endpoint = resolveApiEndpoint(`/api/gtfs/stops/search?q=${encodeURIComponent(query)}`);
  const token = getCurrentTransitToken();
  const headers = withTenantHeaders({ ...(token ? { 'X-Transit-Token': token } : {}) });
  const response = await fetch(endpoint, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status} em ${endpoint}`);
  }

  return (await response.json()) as GtfsStop[];
}
