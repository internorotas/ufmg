import { useQuery } from '@tanstack/react-query';
import { fetchLinhas } from '@/services/api/transitApi';
import type { CategoriaLinhas } from '@/types/data.types';
import { transitQueryKeys } from './queryKeys';

const TRANSIT_STALE_TIME_MS = 10 * 60 * 1000;
const TRANSIT_GC_TIME_MS = 60 * 60 * 1000;

function getTransitRetryDelay(attemptIndex: number) {
  return Math.min(1000 * 2 ** attemptIndex, 5000);
}

export function useLinhasQuery(enabled: boolean) {
  return useQuery<CategoriaLinhas>({
    queryKey: transitQueryKeys.linhas,
    queryFn: fetchLinhas,
    enabled,
    staleTime: TRANSIT_STALE_TIME_MS,
    gcTime: TRANSIT_GC_TIME_MS,
    retry: 6,
    retryDelay: getTransitRetryDelay,
    networkMode: 'offlineFirst',
  });
}
