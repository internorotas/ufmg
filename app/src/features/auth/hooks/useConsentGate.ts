import { useCallback, useMemo, useState } from 'react';
import type { getConsentState } from '@/features/auth/api/authClient';
import { useAuthContext } from '@/features/auth/context/AuthContext';

export type ConsentGateStatus = 'unknown' | 'accepted' | 'denied';

interface ExecuteResult {
  allowed: boolean;
  reason?: 'unauthenticated' | 'denied';
}

export async function resolveConsentStatus(options: {
  isAuthenticated: boolean;
  cachedStatus: ConsentGateStatus;
  loadConsentState: typeof getConsentState;
}): Promise<ConsentGateStatus> {
  if (!options.isAuthenticated) {
    return 'denied';
  }

  if (options.cachedStatus !== 'unknown') {
    return options.cachedStatus;
  }

  const state = await options.loadConsentState();
  return state.consentGps ? 'accepted' : 'denied';
}

export function useConsentGate() {
  const { isAuthenticated, authStatus } = useAuthContext();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const executeProtectedAction = useCallback(
    async (action: () => void | Promise<void>): Promise<ExecuteResult> => {
      if (authStatus === 'booting') {
        return { allowed: false };
      }

      if (!isAuthenticated) {
        setFeedbackMessage('Faça login para usar recursos colaborativos.');
        return { allowed: false, reason: 'unauthenticated' };
      }

      setFeedbackMessage(null);
      await action();
      return { allowed: true };
    },
    [isAuthenticated, authStatus],
  );

  return useMemo(
    () => ({
      feedbackMessage,
      executeProtectedAction,
    }),
    [feedbackMessage, executeProtectedAction],
  );
}
