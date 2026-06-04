import { useEffect, useRef } from 'react';

/**
 * Reproduz um buffer de áudio silencioso em loop para impedir que iOS/Android
 * suspendam a aba quando o app vai para segundo plano.
 *
 * Técnica "NoSleep": manter um AudioContext ativo sinaliza ao SO que o app está
 * em uso, reduzindo (mas não eliminando) o throttle de JS em background.
 *
 * Requisitos:
 *   - Deve ser ativado APÓS um gesto do usuário (autoplay policy)
 *   - Falha silenciosamente se bloqueado pelo browser
 */
export function useAudioKeepAlive(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!enabled) {
      try {
        sourceRef.current?.stop();
      } catch {
        // já parado
      }
      sourceRef.current = null;
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
      return;
    }

    try {
      const ACtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!ACtx) return;

      const ctx = new ACtx();
      ctxRef.current = ctx;

      // Buffer de 1 sample silencioso reproduzido em loop
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(ctx.destination);
      source.start(0);
      sourceRef.current = source;

      // Reativa contexto se suspenso (política de autoplay)
      const handleVisibility = () => {
        if (document.visibilityState === 'visible' && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        try {
          source.stop();
        } catch {
          // já parado
        }
        ctx.close().catch(() => {});
      };
    } catch {
      // Browser sem suporte ou bloqueado por autoplay policy
    }
  }, [enabled]);
}
