import { useQuery } from '@tanstack/react-query';
import localLinhas from '@/data/linhas';
import localParadas from '@/data/paradas';
import type { CategoriaLinhas, Parada } from '@/types/data.types';
import { transitQueryKeys } from './queryKeys';

export const TRANSIT_STALE_TIME_MS = 10 * 60 * 1000;
export const TRANSIT_GC_TIME_MS = 60 * 60 * 1000;

export interface TransitBinaryData {
  linhas: CategoriaLinhas;
  paradas: Parada[];
}

function getTransitRetryDelay(attemptIndex: number) {
  return Math.min(1000 * 2 ** attemptIndex, 5000);
}

export async function fetchTransitBinary(): Promise<TransitBinaryData> {
  return { linhas: localLinhas, paradas: localParadas.paradas };
}

export function useTransitDataQuery(enabled: boolean) {
  return useQuery<TransitBinaryData>({
    queryKey: transitQueryKeys.binary,
    queryFn: fetchTransitBinary,
    enabled,
    staleTime: TRANSIT_STALE_TIME_MS,
    gcTime: TRANSIT_GC_TIME_MS,
    retry: 6,
    retryDelay: getTransitRetryDelay,
    networkMode: 'offlineFirst',
  });
}

export function useLinhasQuery(enabled: boolean) {
  return useQuery<TransitBinaryData, Error, CategoriaLinhas>({
    queryKey: transitQueryKeys.binary,
    queryFn: fetchTransitBinary,
    enabled,
    staleTime: TRANSIT_STALE_TIME_MS,
    gcTime: TRANSIT_GC_TIME_MS,
    retry: 6,
    retryDelay: getTransitRetryDelay,
    networkMode: 'offlineFirst',
    select: (data) => data.linhas,
  });
}
