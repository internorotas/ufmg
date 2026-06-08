import { useEffect, useState } from 'react';
import { calcularPosicaoTeorica, type PosicaoTeorica } from '@/lib/busPosition';
import type { Linha, Parada } from '@/types/data.types';

export function useBusPosition(linha: Linha | null, todasParadas: Parada[]): PosicaoTeorica | null {
  const [posicao, setPosicao] = useState<PosicaoTeorica | null>(() =>
    linha ? calcularPosicaoTeorica(linha, todasParadas, new Date()) : null,
  );

  useEffect(() => {
    if (!linha) {
      setPosicao(null);
      return;
    }

    const calcular = () =>
      setPosicao(calcularPosicaoTeorica(linha, todasParadas, new Date()));

    calcular();
    const id = setInterval(calcular, 30_000);
    return () => clearInterval(id);
  }, [linha, todasParadas]);

  return posicao;
}
