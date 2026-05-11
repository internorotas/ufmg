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
  const apiBaseUrl = import.meta.env.VITE_API_URL;
  if (!apiBaseUrl) {
    return pathname;
  }

  return new URL(pathname, apiBaseUrl).toString();
}

export async function fetchLiveEta(
  linhaId: string,
  paradaId: string,
): Promise<LiveEtaResponse | null> {
  const response = await fetch(resolveEtaEndpoint(`/v1/gps/eta/${linhaId}/${paradaId}`), {
    cache: 'no-store',
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
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Falha ao buscar localização ao vivo: HTTP ${response.status}`);
  }

  return response.json() as Promise<LiveLocationResponse>;
}
