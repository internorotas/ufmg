import { useQuery } from '@tanstack/react-query';
import localParadas from '@/data/paradas';
import { fetchTransitDataBinary } from '@/services/api/transitApi';
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

async function fetchParadasBinary(): Promise<ParadasPayload> {
  try {
    const { paradas } = await fetchTransitDataBinary();
    return { paradas };
  } catch {
    return localParadas as ParadasPayload;
  }
}

export function useParadasQuery(enabled: boolean) {
  return useQuery<ParadasPayload>({
    queryKey: transitQueryKeys.paradas,
    queryFn: fetchParadasBinary,
    enabled,
    staleTime: TRANSIT_STALE_TIME_MS,
    gcTime: TRANSIT_GC_TIME_MS,
    retry: 6,
    retryDelay: getTransitRetryDelay,
    networkMode: 'offlineFirst',
  });
}
