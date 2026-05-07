import { useMemo } from 'react';
import {
  calcularPrevisaoChegada,
  type PrevisaoChegadaResultado,
} from '@/features/eta/domain/calculateEta';
import type { Linha } from '../types/data.types';
import { useCurrentTime } from './useCurrentTime';

/**
 * Hook de conveniência para calcular ETA reativa com base no relógio do app.
 *
 * @param linha Linha selecionada ou `null` quando nenhuma linha está ativa.
 * @param idParadaAtual ID da parada selecionada ou `null` quando não há parada ativa.
 * @returns Resultado da previsão ou `null` quando não há dados suficientes.
 */
export function usePrevisaoChegada(
  linha: Linha | null,
  idParadaAtual: string | null,
): PrevisaoChegadaResultado | null {
  const dataAtual = useCurrentTime();

  return useMemo(() => {
    if (!linha || !idParadaAtual) return null;
    return calcularPrevisaoChegada(linha, idParadaAtual, dataAtual);
  }, [linha, idParadaAtual, dataAtual]);
}
