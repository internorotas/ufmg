import { useEffect, useRef } from 'react';
import { AuthRequestError, refreshSession } from '@/features/auth/api/authClient';
import { useAuthStore } from '@/features/auth/store/authStore';

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

  useEffect(() => {
    if (hasBootstrapped.current) {
      return;
    }

    hasBootstrapped.current = true;
    let active = true;

    const bootstrap = async (attempt = 0): Promise<void> => {
      try {
        const refreshed = await refreshSession();
        if (!active) {
          return;
        }

        if (!refreshed.accessToken) {
          setAnonymousSession();
          return;
        }

        setAuthenticatedSession({
          accessToken: refreshed.accessToken,
          user: refreshed.user ?? null,
        });
      } catch (error) {
        if (!active) {
          return;
        }

        const retryDelay = AUTH_BOOTSTRAP_RETRY_DELAYS_MS[attempt];
        if (retryDelay !== undefined && isTransientBootstrapError(error)) {
          window.setTimeout(() => {
            if (!active) {
              return;
            }

            void bootstrap(attempt + 1);
          }, retryDelay);
          return;
        }

        setAnonymousSession();
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [setAnonymousSession, setAuthenticatedSession]);
}
