import { useAuthStore } from '@/features/auth/store/authStore';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';

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
  accessToken: string | null;
  expiresIn: number | null;
  tokenType: 'Bearer' | null;
  user?: AuthenticatedUser | null;
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
  return resolveApiEndpoint(pathname);
}

export function getAuthHeaders(): HeadersInit | undefined {
  const accessToken = useAuthStore.getState().accessToken;
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
      headers: withTenantHeaders(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha de rede no refresh de sessao';
    throw new AuthRequestError(message, null);
  }

  if (!response.ok) {
    throw new AuthRequestError(
      `Falha no refresh de sessao: HTTP ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<RefreshResponse>;
}

export async function startGoogleLoginFlow(returnUrl?: string): Promise<void> {
  const continueUrl = returnUrl ?? resolveLoginContinueUrl();
  const endpoint = new URL(resolveAuthEndpoint('/v1/auth/google/start'), window.location.origin);
  endpoint.searchParams.set('continueUrl', continueUrl);

  let response: Response;
  try {
    response = await fetch(endpoint.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: withTenantHeaders(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha de rede ao iniciar login';
    throw new AuthRequestError(message, null);
  }

  if (!response.ok) {
    throw new AuthRequestError(
      `Falha ao iniciar login Google: HTTP ${response.status}`,
      response.status,
    );
  }

  const payload = (await response.json()) as Partial<GoogleStartResponse>;

  if (!payload.authUrl || payload.provider !== 'google') {
    throw new AuthRequestError('Resposta inválida ao iniciar login Google', null);
  }

  window.location.assign(payload.authUrl);
}

/**
 * Pinga o backend para acordá-lo antes do fluxo OAuth.
 * O Render free tier dorme após 15min de inatividade; o cold start leva ~15s.
 * Esta chamada é best-effort: erros e timeouts são silenciados.
 */
export async function warmupBackend(): Promise<void> {
  const endpoint = resolveApiEndpoint('/health');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch {
    // silenciar — warmup é best-effort
  } finally {
    clearTimeout(timeout);
  }
}

export async function getConsentState(): Promise<ConsentState> {
  const response = await fetch(resolveAuthEndpoint('/v1/auth/consent'), {
    method: 'GET',
    cache: 'no-store',
    headers: withTenantHeaders(getAuthHeaders()),
  });

  if (!response.ok) {
    throw new AuthRequestError(
      `Falha ao carregar consentimento: HTTP ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<ConsentState>;
}

export async function updateConsentState(payload: {
  consentGps: boolean;
  consentResearch: boolean;
}): Promise<ConsentState> {
  const headers: HeadersInit = {
    ...Object.fromEntries(withTenantHeaders(getAuthHeaders()).entries()),
    'Content-Type': 'application/json',
  };

  const response = await fetch(resolveAuthEndpoint('/v1/auth/consent'), {
    method: 'PUT',
    cache: 'no-store',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new AuthRequestError(
      `Falha ao atualizar consentimento: HTTP ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<ConsentState>;
}
