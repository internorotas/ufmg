import { useEffect, useState } from 'react';

/**
 * Mantém um relógio reativo para atualizar cálculos dependentes de tempo.
 *
 * O hook existe para desacoplar componentes da API de tempo do navegador
 * e centralizar a frequência de atualização usada por ETA e horários.
 *
 * @returns Data atual atualizada em intervalos regulares.
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
