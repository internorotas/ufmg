import { useEffect, useRef } from 'react';
import { AuthRequestError, refreshSession, warmupBackend } from '@/features/auth/api/authClient';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useMounted } from '@/hooks/useMounted';

const AUTH_BOOTSTRAP_RETRY_DELAYS_MS = [500, 1000, 2000, 4000, 5000, 5000, 5000];

function isTransientBootstrapError(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }

  return error.status === null || error.status >= 500;
}

export function useAuthBootstrap() {
  const hasBootstrapped = useRef(false);
  const setAuthenticatedSession = useAuthStore((state) => state.setAuthenticatedSession);
  const setAnonymousSession = useAuthStore((state) => state.setAnonymousSession);
  const isMounted = useMounted();

  useEffect(() => {
    if (hasBootstrapped.current) {
      return;
    }

    hasBootstrapped.current = true;

    const bootstrap = async (attempt = 0): Promise<void> => {
      // Na primeira tentativa, dispara o warmup em paralelo (best-effort).
      // O Render free tier dorme após 15 min de inatividade; o warmup acorda
      // o backend enquanto a requisição de refresh está em andamento, de modo
      // que as retentativas já encontrem o servidor ativo sem adicionar latência
      // extra ao caminho crítico quando o backend já está acordado.
      if (attempt === 0) {
        void warmupBackend();
      }

      try {
        const refreshed = await refreshSession();
        if (!isMounted()) return;

        if (!refreshed.accessToken) {
          setAnonymousSession();
          return;
        }

        setAuthenticatedSession({
          accessToken: refreshed.accessToken,
          user: refreshed.user ?? null,
        });
      } catch (error) {
        if (!isMounted()) return;

        const retryDelay = AUTH_BOOTSTRAP_RETRY_DELAYS_MS[attempt];
        if (retryDelay !== undefined && isTransientBootstrapError(error)) {
          window.setTimeout(() => {
            if (!isMounted()) return;
            void bootstrap(attempt + 1);
          }, retryDelay);
          return;
        }

        setAnonymousSession();
      }
    };

    void bootstrap();
  }, [isMounted, setAnonymousSession, setAuthenticatedSession]);
}
