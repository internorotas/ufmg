import { fetchAuthenticatedApi } from '@/features/auth/api/fetchAuthenticatedApi';
import { resolveApiEndpoint } from '@/services/api/apiClient';

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterMs: number | null,
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Códigos públicos estáveis do backend (ver backend/src/gps/gps-errors.ts).
// A UI mapeia por `code`, nunca pelo `message` bruto do backend — texto livre
// pode mudar sem aviso e não deve ser exibido diretamente ao usuário.
export const GPS_ERROR_CODE_MESSAGES: Record<string, string> = {
  GPS_LINE_NOT_FOUND: 'Esta linha não foi encontrada.',
  GPS_LINE_SUSPENDED: 'Esta linha está temporariamente suspensa.',
  GPS_SESSION_ALREADY_ACTIVE: 'Você já tem uma sessão de rastreio ativa.',
  GPS_ACTIVE_SESSION_DIFFERENT_LINE: 'Já existe uma sessão de rastreio ativa em outra linha.',
  GPS_IDEMPOTENCY_KEY_REUSED: 'Essa tentativa já foi processada. Tente iniciar novamente.',
  GPS_SESSION_NOT_FOUND: 'Sessão de rastreio não encontrada.',
  GPS_INVALID_REQUEST: 'Não foi possível processar a solicitação.',
  GPS_CALENDAR_UNAVAILABLE:
    'Não foi possível confirmar o calendário agora. Tente novamente em instantes.',
  GPS_RATE_LIMITED: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  GPS_INTERNAL_ERROR: 'Não foi possível iniciar o rastreio. Tente novamente.',
};

export const GPS_GENERIC_ERROR_MESSAGE = 'Não foi possível iniciar o rastreio. Tente novamente.';

interface GpsPublicErrorBody {
  statusCode?: number;
  code?: string;
  message?: string;
  requestId?: string;
}

export class GpsApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string | null = null,
    public readonly requestId: string | null = null,
  ) {
    super(message);
    this.name = 'GpsApiError';
  }
}

export interface GpsActiveSessionConflictInfo {
  sessionId: string;
  linhaId: string;
  requestedLinhaId: string;
  lastActivityAt: string;
  staleCandidate: boolean;
}

// 409 GPS_ACTIVE_SESSION_DIFFERENT_LINE nunca deve ser tratado como o
// GpsApiError genérico — carrega os dados mínimos da sessão ativa em outra
// linha para a UI oferecer retomar/encerrar/abandonar/cancelar (nunca retomar
// silenciosamente na linha errada).
export class GpsActiveSessionConflictError extends GpsApiError {
  constructor(
    message: string,
    requestId: string | null,
    public readonly session: GpsActiveSessionConflictInfo,
  ) {
    super(message, 409, 'GPS_ACTIVE_SESSION_DIFFERENT_LINE', requestId);
    this.name = 'GpsActiveSessionConflictError';
  }
}

async function parsePublicErrorBody(response: Response): Promise<GpsPublicErrorBody | null> {
  return (await response.json().catch(() => null)) as GpsPublicErrorBody | null;
}

function friendlyMessageFor(code: string | undefined): string {
  return (code && GPS_ERROR_CODE_MESSAGES[code]) || GPS_GENERIC_ERROR_MESSAGE;
}

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
  // Gerado pelo cliente (ex: crypto.randomUUID()) — reenvio com a mesma chave
  // retorna a sessão já criada em vez de duplicar (double-click, timeout de rede).
  idempotencyKey?: string;
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

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const retryAfterMs = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : null;
    throw new RateLimitError(
      'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
      Number.isFinite(retryAfterMs) ? retryAfterMs : null,
    );
  }

  if (!response.ok) {
    const body = await parsePublicErrorBody(response);

    if (
      response.status === 409 &&
      body?.code === 'GPS_ACTIVE_SESSION_DIFFERENT_LINE' &&
      isActiveSessionConflictBody(body)
    ) {
      throw new GpsActiveSessionConflictError(
        friendlyMessageFor(body.code),
        body.requestId ?? null,
        body.session,
      );
    }

    throw new GpsApiError(
      friendlyMessageFor(body?.code),
      response.status,
      body?.code ?? null,
      body?.requestId ?? null,
    );
  }

  return response;
}

function isActiveSessionConflictBody(
  body: GpsPublicErrorBody,
): body is GpsPublicErrorBody & { session: GpsActiveSessionConflictInfo } {
  const session = (body as { session?: unknown }).session;
  return (
    typeof session === 'object' &&
    session !== null &&
    typeof (session as GpsActiveSessionConflictInfo).sessionId === 'string' &&
    typeof (session as GpsActiveSessionConflictInfo).linhaId === 'string'
  );
}

export interface GpsStartSessionResult {
  sessionId: string;
  scheduleMatchStatus: 'matched' | 'unmatched';
  // Sessão do mesmo dono/linha retomada em vez de criada — ver
  // backend/src/gps/gps.service.ts GpsStartSessionResponse. Quando `resumed`,
  // os campos abaixo vêm preenchidos e substituem o estado local em vez de
  // resetar contadores como se fosse sessão nova.
  resumed?: boolean;
  linhaId?: string;
  iniciadoAt?: string;
  snapshotsCount?: number;
  lastActivityAt?: string;
  staleCandidate?: boolean;
}

export async function startGpsSession(payload: GpsSessionPayload): Promise<GpsStartSessionResult> {
  const response = await fetchGps('/v1/gps/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.json() as Promise<GpsStartSessionResult>;
}

export interface ActiveGpsSessionInfo {
  sessionId: string;
  linhaId: string;
  startedAt: string;
  scheduleMatchStatus: 'matched' | 'unmatched';
  snapshotsCount: number;
  lastActivityAt: string;
  staleCandidate: boolean;
  status: 'active';
}

// Consultada ao abrir o fluxo de rastreio — mesma resolução de ownership do
// POST /gps/sessions, então nunca diverge sobre qual sessão está ativa.
export async function getActiveGpsSession(): Promise<{ session: ActiveGpsSessionInfo | null }> {
  const response = await fetchGps('/v1/gps/sessions/active');
  return response.json() as Promise<{ session: ActiveGpsSessionInfo | null }>;
}

export async function abandonGpsSession(sessionId: string): Promise<void> {
  await fetchGps(`/v1/gps/sessions/${sessionId}/abandon`, {
    method: 'POST',
  });
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

export interface GpsRatingPayload {
  rating: number;
  comment?: string;
}

export async function rateTrip(sessionId: string, payload: GpsRatingPayload): Promise<void> {
  await fetchGps(`/v1/gps/sessions/${sessionId}/rating`, {
    method: 'POST',
    body: JSON.stringify(payload),
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
