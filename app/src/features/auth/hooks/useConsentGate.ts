import { useCallback, useMemo, useState } from 'react';
import { getConsentState, updateConsentState } from '@/features/auth/api/authClient';
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
  const { isAuthenticated } = useAuthContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [consentStatus, setConsentStatus] = useState<ConsentGateStatus>('unknown');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(null);

  const executeProtectedAction = useCallback(
    async (action: () => void | Promise<void>): Promise<ExecuteResult> => {
      const status = await resolveConsentStatus({
        isAuthenticated,
        cachedStatus: consentStatus,
        loadConsentState: getConsentState,
      });

      if (!isAuthenticated) {
        setFeedbackMessage('Faça login para usar recursos colaborativos.');
        return { allowed: false, reason: 'unauthenticated' };
      }

      if (status === 'accepted') {
        setFeedbackMessage(null);
        await action();
        return { allowed: true };
      }

      if (status === 'denied') {
        setConsentStatus('denied');
        setFeedbackMessage('Contribuição bloqueada: consentimento LGPD não aceito.');
        return { allowed: false, reason: 'denied' };
      }

      setPendingAction(() => action);
      setDialogOpen(true);
      setFeedbackMessage(null);
      return { allowed: false };
    },
    [consentStatus, isAuthenticated],
  );

  const acceptAndContinue = useCallback(async () => {
    const updated = await updateConsentState({ consentGps: true, consentResearch: false });
    setConsentStatus(updated.consentGps ? 'accepted' : 'denied');
    setDialogOpen(false);

    const action = pendingAction;
    setPendingAction(null);
    if (action && updated.consentGps) {
      await action();
    }
  }, [pendingAction]);

  const refuseConsent = useCallback(async () => {
    await updateConsentState({ consentGps: false, consentResearch: false });
    setConsentStatus('denied');
    setDialogOpen(false);
    setPendingAction(null);
    setFeedbackMessage('Contribuição bloqueada: consentimento LGPD não aceito.');
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setPendingAction(null);
  }, []);

  return useMemo(
    () => ({
      dialogOpen,
      consentStatus,
      feedbackMessage,
      executeProtectedAction,
      acceptAndContinue,
      refuseConsent,
      closeDialog,
    }),
    [
      dialogOpen,
      consentStatus,
      feedbackMessage,
      executeProtectedAction,
      acceptAndContinue,
      refuseConsent,
      closeDialog,
    ],
  );
}
