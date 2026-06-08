import { useEffect, useState } from 'react';
import { calcularPosicaoTeorica, type PosicaoTeorica } from '@/lib/busPosition';
import type { Linha, Parada } from '@/types/data.types';

function calcularTodasPosicoes(
  linhas: Linha[],
  todasParadas: Parada[],
  agora: Date,
): Map<string, PosicaoTeorica> {
  const mapa = new Map<string, PosicaoTeorica>();
  for (const linha of linhas) {
    const pos = calcularPosicaoTeorica(linha, todasParadas, agora);
    if (pos) mapa.set(linha.idRota, pos);
  }
  return mapa;
}

export function useAllBusPositions(
  linhas: Linha[],
  todasParadas: Parada[],
): Map<string, PosicaoTeorica> {
  const [posicoes, setPosicoes] = useState<Map<string, PosicaoTeorica>>(() =>
    calcularTodasPosicoes(linhas, todasParadas, new Date()),
  );

  useEffect(() => {
    setPosicoes(calcularTodasPosicoes(linhas, todasParadas, new Date()));

    const id = setInterval(() => {
      setPosicoes(calcularTodasPosicoes(linhas, todasParadas, new Date()));
    }, 5_000);

    return () => clearInterval(id);
  }, [linhas, todasParadas]);

  return posicoes;
}
