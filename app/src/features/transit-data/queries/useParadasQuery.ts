import { useQuery } from '@tanstack/react-query';
import type { Parada } from '@/types/data.types';
import { transitQueryKeys } from './queryKeys';
import {
  fetchTransitBinary,
  TRANSIT_GC_TIME_MS,
  TRANSIT_STALE_TIME_MS,
  type TransitBinaryData,
} from './useLinhasQuery';

export interface ParadasPayload {
  paradas: Parada[];
}

export function useParadasQuery(enabled: boolean) {
  return useQuery<TransitBinaryData, Error, ParadasPayload>({
    queryKey: transitQueryKeys.binary,
    queryFn: fetchTransitBinary,
    enabled,
    staleTime: TRANSIT_STALE_TIME_MS,
    gcTime: TRANSIT_GC_TIME_MS,
    retry: 6,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    networkMode: 'offlineFirst',
    select: (data) => ({ paradas: data.paradas }),
  });
}
