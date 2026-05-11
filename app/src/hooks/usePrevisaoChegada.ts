import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchLiveEta } from '@/features/eta/api/liveEtaClient';
import {
  calcularPrevisaoChegada,
  type PrevisaoChegadaResultado,
} from '@/features/eta/domain/calculateEta';
import type { Linha } from '../types/data.types';
import { useCurrentTime } from './useCurrentTime';

export interface PrevisaoChegadaRemota {
  realtimeEtaMinutes: number | null;
  historicalMedianDelaySeconds: number | null;
  historicalP90DelaySeconds: number | null;
  samples: number;
  updatedAt: string | null;
}

export interface PrevisaoChegadaComposta extends PrevisaoChegadaResultado {
  fonte: 'local' | 'realtime';
  remoto: PrevisaoChegadaRemota | null;
}

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
): PrevisaoChegadaComposta | null {
  const dataAtual = useCurrentTime();
  const { data: remoto } = useQuery({
    queryKey: ['live-eta', linha?.idRota ?? null, idParadaAtual],
    queryFn: async () => fetchLiveEta(linha!.idRota, idParadaAtual!),
    enabled: Boolean(linha?.idRota && idParadaAtual),
    staleTime: 15_000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchInterval: 15_000,
    networkMode: 'offlineFirst',
  });

  return useMemo(() => {
    if (!linha || !idParadaAtual) return null;
    const previsaoLocal = calcularPrevisaoChegada(linha, idParadaAtual, dataAtual);
    if (!previsaoLocal) {
      return null;
    }

    if (remoto?.realtimeEtaMinutes !== null && remoto?.realtimeEtaMinutes !== undefined) {
      const minutosRemotos = Math.max(0, Math.round(remoto.realtimeEtaMinutes));
      return {
        ...previsaoLocal,
        fonte: 'realtime',
        remoto,
        proximoOnibus: previsaoLocal.proximoOnibus
          ? {
              ...previsaoLocal.proximoOnibus,
              minutosFaltantes: minutosRemotos,
            }
          : null,
      };
    }

    return {
      ...previsaoLocal,
      fonte: 'local',
      remoto: remoto ?? null,
    };
  }, [linha, idParadaAtual, dataAtual, remoto]);
}
