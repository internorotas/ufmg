import { useEffect, useRef } from 'react';
import { refreshSession } from '@/features/auth/api/authClient';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useAuthBootstrap() {
  const hasBootstrapped = useRef(false);
  const setAuthenticatedSession = useAuthStore((state) => state.setAuthenticatedSession);
  const setAnonymousSession = useAuthStore((state) => state.setAnonymousSession);

  useEffect(() => {
    if (hasBootstrapped.current) {
      return;
    }

    hasBootstrapped.current = true;

    const bootstrap = async () => {
      try {
        const refreshed = await refreshSession();
        setAuthenticatedSession({
          accessToken: refreshed.accessToken,
          user: refreshed.user ?? null,
        });
      } catch {
        setAnonymousSession();
      }
    };

    void bootstrap();
  }, [setAnonymousSession, setAuthenticatedSession]);
}
