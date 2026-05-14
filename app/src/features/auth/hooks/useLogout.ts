import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { logout as logoutRequest } from '@/features/profile/api/profileClient';

interface UseLogoutResult {
  logout: () => Promise<void>;
  isPending: boolean;
  errorMessage: string | null;
}

export function useLogout(): UseLogoutResult {
  const navigate = useNavigate();
  const resetSession = useAuthStore((state) => state.resetSession);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logout = useCallback(async () => {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setErrorMessage(null);

    try {
      await logoutRequest();
      resetSession();
      navigate('/', {
        replace: true,
        state: {
          authFeedback: 'Sessão encerrada com sucesso.',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao encerrar sessão.';
      setErrorMessage(message);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [isPending, navigate, resetSession]);

  return {
    logout,
    isPending,
    errorMessage,
  };
}
