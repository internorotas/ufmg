import { fetchAuthenticatedApi } from '@/features/auth/api/fetchAuthenticatedApi';
import { resolveApiEndpoint } from '@/services/api/apiClient';

export interface GpsPointPayload {
  lat: number;
  lng: number;
  speed: number;
  accuracy: number;
  heading?: number;
  timestampDispositivo: string;
  // Cliente honesto envia true em simuladores; ataque ativo precisa de atestacao real
  // (Play Integrity / DeviceCheck — pendente).
  isMockProvider?: boolean;
}

export interface GpsBatchPayload {
  sessionId: string;
  linhaId: string;
  isBatchSubmission: boolean;
  points: GpsPointPayload[];
}

export interface GpsSessionPayload {
  linhaId: string;
}

function resolveGpsEndpoint(pathname: string): string {
  return resolveApiEndpoint(pathname);
}

async function fetchGps(pathname: string, init?: RequestInit): Promise<Response> {
  const response = await fetchAuthenticatedApi(resolveGpsEndpoint(pathname), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
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

export interface ViagemHistoryItem {
  id: string;
  linhaId: string;
  linhaNome: string | null;
  linhaCorHex: string | null;
  iniciadoAt: string;
  encerradoAt: string;
  motivoEncerramento: string | null;
  snapshotsCount: number | null;
  displacementKm: number | null;
}

export async function getViagemHistory(): Promise<ViagemHistoryItem[]> {
  const response = await fetchGps('/v1/gps/viagens');
  return response.json() as Promise<ViagemHistoryItem[]>;
}
