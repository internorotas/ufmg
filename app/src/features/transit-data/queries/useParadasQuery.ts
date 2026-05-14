import { useQuery } from '@tanstack/react-query';
import { fetchParadas } from '@/services/api/transitApi';
import type { Parada } from '@/types/data.types';
import { transitQueryKeys } from './queryKeys';

const TRANSIT_STALE_TIME_MS = 10 * 60 * 1000;
const TRANSIT_GC_TIME_MS = 60 * 60 * 1000;

function getTransitRetryDelay(attemptIndex: number) {
  return Math.min(1000 * 2 ** attemptIndex, 5000);
}

interface ParadasPayload {
  paradas: Parada[];
}

export function useParadasQuery(enabled: boolean) {
  return useQuery<ParadasPayload>({
    queryKey: transitQueryKeys.paradas,
    queryFn: fetchParadas,
    enabled,
    staleTime: TRANSIT_STALE_TIME_MS,
    gcTime: TRANSIT_GC_TIME_MS,
    retry: 6,
    retryDelay: getTransitRetryDelay,
    networkMode: 'offlineFirst',
  });
}
