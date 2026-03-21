import { useEffect, useState } from 'react';

/**
 * Hook que mantém e atualiza a hora atual a cada 30 segundos.
 * Garante que cálculos de ETA e horários sejam recalculados automaticamente
 * enquanto o usuário mantém o aplicativo aberto.
 */
export function useCurrentTime(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return now;
}
