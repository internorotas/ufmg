import type { IRoutingService } from './IRoutingService';

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

export class OsrmRoutingService implements IRoutingService {
  async getRoute(stops: [number, number][]): Promise<[number, number][]> {
    // OSRM expects lng,lat; Leaflet uses [lat, lng]
    const coordStr = stops.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const url = `${OSRM_BASE_URL}/${coordStr}?overview=full&geometries=geojson`;

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

    // GeoJSON returns [lng, lat] — convert to [lat, lng] for Leaflet
    return coords.map(([lng, lat]) => [lat, lng] as [number, number]);
  }
}
