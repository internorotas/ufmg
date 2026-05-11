export interface AuthenticatedUser {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  nickname: string | null;
}

export type RankingDetail = 'geral' | 'por_linha';
export type NotificationProfile = 'minimo' | 'normal' | 'tudo';

export class AuthRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
  ) {
    super(message);
    this.name = 'AuthRequestError';
  }
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user?: AuthenticatedUser;
}

interface GoogleStartResponse {
  provider: 'google';
  authUrl: string;
  state: string;
  codeChallengeMethod: 'S256';
}

function resolveLoginContinueUrl(): string {
  return new URL(window.location.href).toString();
}

export interface ConsentState {
  consentGps: boolean;
  consentResearch: boolean;
  consentGpsAt: string | null;
  consentResearchAt: string | null;
}

export type AuthEndpointPath =
  | '/v1/auth/refresh'
  | '/v1/auth/google/start'
  | '/v1/auth/consent'
  | '/v1/auth/profile'
  | '/v1/auth/logout'
  | '/v1/auth/delete-account';

export function resolveAuthEndpoint(pathname: AuthEndpointPath): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  if (!apiBaseUrl) {
    return pathname;
  }

  return new URL(pathname, apiBaseUrl).toString();
}

export function getAuthHeaders(): HeadersInit | undefined {
  const accessToken = window.__internoAuthToken ?? null;
  if (!accessToken) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function refreshSession(): Promise<RefreshResponse> {
  let response: Response;

  try {
    response = await fetch(resolveAuthEndpoint('/v1/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha de rede no refresh de sessao';
    throw new AuthRequestError(message, null);
  }

  if (!response.ok) {
    throw new AuthRequestError(`Falha no refresh de sessao: HTTP ${response.status}`, response.status);
  }

  return response.json() as Promise<RefreshResponse>;
}

export async function startGoogleLoginFlow(): Promise<void> {
  const endpoint = new URL(resolveAuthEndpoint('/v1/auth/google/start'), window.location.origin);
  endpoint.searchParams.set('continueUrl', resolveLoginContinueUrl());

  const response = await fetch(endpoint.toString(), {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Falha ao iniciar login Google: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as Partial<GoogleStartResponse>;

  if (!payload.authUrl || payload.provider !== 'google') {
    throw new Error('Resposta inválida ao iniciar login Google');
  }

  window.location.assign(payload.authUrl);
}

export async function getConsentState(): Promise<ConsentState> {
  const response = await fetch(resolveAuthEndpoint('/v1/auth/consent'), {
    method: 'GET',
    cache: 'no-store',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar consentimento: HTTP ${response.status}`);
  }

  return response.json() as Promise<ConsentState>;
}

export async function updateConsentState(payload: {
  consentGps: boolean;
  consentResearch: boolean;
}): Promise<ConsentState> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(getAuthHeaders() ?? {}),
  };

  const response = await fetch(resolveAuthEndpoint('/v1/auth/consent'), {
    method: 'PUT',
    cache: 'no-store',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Falha ao atualizar consentimento: HTTP ${response.status}`);
  }

  return response.json() as Promise<ConsentState>;
}
