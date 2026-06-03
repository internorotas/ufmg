import { useCallback, useEffect, useRef } from 'react';

interface UseInactivityTimerOptions {
  /** Milissegundos de inatividade antes do aviso. */
  warningMs: number;
  /** Milissegundos de inatividade antes do logout (deve ser > warningMs). */
  timeoutMs: number;
  onWarning: () => void;
  onTimeout: () => void;
  enabled: boolean;
}

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'] as const;

export function useInactivityTimer({
  warningMs,
  timeoutMs,
  onWarning,
  onTimeout,
  enabled,
}: UseInactivityTimerOptions): { resetTimer: () => void } {
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearTimers();
    warnedRef.current = false;

    warningTimerRef.current = setTimeout(() => {
      warnedRef.current = true;
      onWarning();
      logoutTimerRef.current = setTimeout(() => {
        onTimeout();
      }, timeoutMs - warningMs);
    }, warningMs);
  }, [clearTimers, enabled, onWarning, onTimeout, timeoutMs, warningMs]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    resetTimer();

    const handleActivity = () => resetTimer();
    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      clearTimers();
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, handleActivity);
      }
    };
  }, [clearTimers, enabled, resetTimer]);

  return { resetTimer };
}
