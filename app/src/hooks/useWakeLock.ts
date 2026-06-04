import { useCallback, useEffect, useRef } from 'react';

/**
 * Solicita Screen Wake Lock enquanto `enabled=true`.
 * Previne que o SO apague a tela automaticamente durante o rastreio GPS.
 * Re-adquire o lock quando o usuário volta para a aba após uma saída temporária.
 *
 * Limitações conhecidas:
 *   - Liberado automaticamente quando a tela é bloqueada manualmente (botão físico)
 *   - Não funciona quando o app está em segundo plano
 *   - Requer HTTPS
 */
export function useWakeLock(enabled: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const acquire = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    if (sentinelRef.current && !sentinelRef.current.released) return;
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // Bateria baixa ou permissão negada — ignorar silenciosamente
    }
  }, []);

  const release = useCallback(() => {
    sentinelRef.current?.release().catch(() => {});
    sentinelRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      release();
      return;
    }

    void acquire();

    // Re-adquire quando o usuário volta para a aba (wake lock é liberado quando fica invisível)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabledRef.current) {
        void acquire();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      release();
    };
  }, [enabled, acquire, release]);
}
