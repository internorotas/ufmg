export interface AuthenticatedUser {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  nickname: string | null;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user?: AuthenticatedUser;
}

export interface ConsentState {
  consentGps: boolean;
  consentResearch: boolean;
  consentGpsAt: string | null;
  consentResearchAt: string | null;
}

function resolveAuthEndpoint(
  pathname: '/v1/auth/refresh' | '/v1/auth/google/start' | '/v1/auth/consent',
): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  if (!apiBaseUrl) {
    return pathname;
  }

  return new URL(pathname, apiBaseUrl).toString();
}

function getAuthHeaders(): HeadersInit | undefined {
  const accessToken = window.__internoAuthToken ?? null;
  if (!accessToken) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function refreshSession(): Promise<RefreshResponse> {
  const response = await fetch(resolveAuthEndpoint('/v1/auth/refresh'), {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Falha no refresh de sessao: HTTP ${response.status}`);
  }

  return response.json() as Promise<RefreshResponse>;
}

export function getGoogleStartUrl(): string {
  return resolveAuthEndpoint('/v1/auth/google/start');
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
