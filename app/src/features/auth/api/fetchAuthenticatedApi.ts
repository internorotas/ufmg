import { useAuthStore } from '@/features/auth/store/authStore';
import { withTenantHeaders } from '@/services/api/apiClient';
import { refreshSession } from './authClient';

export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

function dispatchSessionExpired(message: string) {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { message } }));
}

/**
 * Fetch autenticado com refresh automático em 401.
 *
 * - Injeta Authorization: Bearer <token> + tenant headers
 * - Em 401: tenta refreshSession() → atualiza store → refaz request uma vez
 * - Se refresh falhar: despacha evento global SESSION_EXPIRED_EVENT
 */
export async function fetchAuthenticatedApi(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const makeRequest = async (token: string | null): Promise<Response> => {
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      return await fetch(url, {
        ...init,
        headers: withTenantHeaders({
          ...authHeader,
          ...(init.headers as Record<string, string> | undefined),
        }),
      });
    } catch {
      throw new Error('Falha de rede ao comunicar com a API');
    }
  };

  const currentToken = useAuthStore.getState().accessToken;
  const response = await makeRequest(currentToken);

  if (response.status !== 401) {
    return response;
  }

  // Tenta refresh uma vez
  try {
    const refreshed = await refreshSession();
    if (!refreshed.accessToken) {
      throw new Error('refresh retornou token nulo');
    }

    useAuthStore.getState().setAuthenticatedSession({
      accessToken: refreshed.accessToken,
      user: refreshed.user ?? null,
    });

    return makeRequest(refreshed.accessToken);
  } catch {
    useAuthStore.getState().resetSession();
    dispatchSessionExpired('Sessão expirada. Faça login novamente.');
    return response;
  }
}
