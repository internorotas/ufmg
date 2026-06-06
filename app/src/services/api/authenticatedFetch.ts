import { useAuthStore } from '@/features/auth/store/authStore';
import { resolveApiEndpoint, withTenantHeaders } from './apiClient';

// Singleton: garante no máximo um refresh em flight por vez
let refreshingPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async (): Promise<string | null> => {
    try {
      const res = await fetch(resolveApiEndpoint('/v1/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: withTenantHeaders(),
      });

      if (!res.ok) return null;

      const data = (await res.json()) as { accessToken?: string | null };
      if (!data.accessToken) return null;

      // Acessa store DIRETAMENTE — sem hook React, sem causar re-render aqui
      useAuthStore.getState().setAuthenticatedSession({
        accessToken: data.accessToken,
        user: useAuthStore.getState().user,
      });

      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

/**
 * Wrapper sobre fetch que:
 *  1. Injeta Authorization header com o token atual do store
 *  2. Em caso de 401: tenta refresh via cookie httpOnly
 *  3. Se refresh falhar: chama resetSession() sem causar loop de render
 *  4. Se refresh ok: retenta a requisição original com o novo token
 *
 * Substitui fetch() em chamadas autenticadas. Não usa React hooks —
 * pode ser chamado de qualquer contexto (serviços, utils, callbacks).
 */
export async function authenticatedFetch(pathname: string, init?: RequestInit): Promise<Response> {
  const token = useAuthStore.getState().accessToken;

  const headers = withTenantHeaders({
    ...init?.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const res = await fetch(resolveApiEndpoint(pathname), { ...init, headers });

  if (res.status !== 401) return res;

  // Tenta renovar sessão via refresh cookie
  const newToken = await tryRefreshToken();

  if (!newToken) {
    // Logout silencioso: store access direto evita loop de useEffect
    useAuthStore.getState().resetSession();
    throw new AuthSessionExpiredError();
  }

  // Retry com token renovado
  const retryHeaders = withTenantHeaders({
    ...init?.headers,
    Authorization: `Bearer ${newToken}`,
  });

  return fetch(resolveApiEndpoint(pathname), { ...init, headers: retryHeaders });
}

export class AuthSessionExpiredError extends Error {
  constructor() {
    super('Sessão expirada. Faça login novamente.');
    this.name = 'AuthSessionExpiredError';
  }
}
