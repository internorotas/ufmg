import { getAuthHeaders } from '@/features/auth/api/authClient';

export interface GpsPointPayload {
  lat: number;
  lng: number;
  speed: number;
  accuracy: number;
  heading?: number;
  timestampDispositivo: string;
}

export interface GpsBatchPayload {
  sessionId: string;
  linhaId: string;
  userIdHash: string;
  isBatchSubmission: boolean;
  points: GpsPointPayload[];
}

export interface GpsSessionPayload {
  linhaId: string;
  userIdHash: string;
}

function resolveGpsEndpoint(pathname: string): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL;
  if (!apiBaseUrl) {
    return pathname;
  }

  return new URL(pathname, apiBaseUrl).toString();
}

async function fetchGps(pathname: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(resolveGpsEndpoint(pathname), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthHeaders() ?? {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Falha na operação GPS: HTTP ${response.status}`);
  }

  return response;
}

export async function startGpsSession(payload: GpsSessionPayload): Promise<{ sessionId: string }> {
  const response = await fetchGps('/v1/gps/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.json() as Promise<{ sessionId: string }>;
}

export async function submitGpsBatch(payload: GpsBatchPayload): Promise<void> {
  await fetchGps('/v1/gps/batch', {
    method: 'POST',
    body: JSON.stringify(payload),
    keepalive: true,
  });
}

export async function finishGpsSession(sessionId: string, motivo: string): Promise<void> {
  await fetchGps(`/v1/gps/sessions/${sessionId}/finish`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
    keepalive: true,
  });
}
