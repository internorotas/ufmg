import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';

export interface LiveEtaResponse {
  realtimeEtaMinutes: number | null;
  historicalMedianDelaySeconds: number | null;
  historicalP90DelaySeconds: number | null;
  samples: number;
  updatedAt: string | null;
}

export interface LiveLocationResponse {
  lat: number;
  lng: number;
  heading: number | null;
  confidence: number;
  updatedAt: string;
}

function resolveEtaEndpoint(pathname: string): string {
  return resolveApiEndpoint(pathname);
}

export async function fetchLiveEta(
  linhaId: string,
  paradaId: string,
): Promise<LiveEtaResponse | null> {
  const response = await fetch(resolveEtaEndpoint(`/v1/gps/eta/${linhaId}/${paradaId}`), {
    cache: 'no-store',
    headers: withTenantHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Falha ao buscar ETA ao vivo: HTTP ${response.status}`);
  }

  return response.json() as Promise<LiveEtaResponse>;
}

export async function fetchLiveLocation(linhaId: string): Promise<LiveLocationResponse | null> {
  const response = await fetch(resolveEtaEndpoint(`/v1/gps/location/${linhaId}`), {
    cache: 'no-store',
    headers: withTenantHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Falha ao buscar localização ao vivo: HTTP ${response.status}`);
  }

  return response.json() as Promise<LiveLocationResponse>;
}
