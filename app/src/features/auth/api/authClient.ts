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

function resolveAuthEndpoint(pathname: '/v1/auth/refresh' | '/v1/auth/google/start'): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  if (!apiBaseUrl) {
    return pathname;
  }

  return new URL(pathname, apiBaseUrl).toString();
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
