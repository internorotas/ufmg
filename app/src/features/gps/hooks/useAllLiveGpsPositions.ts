import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  getAllLiveGpsPositions,
  LiveGpsFetchError,
  type LiveGpsBatchItem,
  type LiveGpsFetchStatus,
} from '@/features/gps/api/gpsClient';

const POLL_INTERVAL_MS = 10_000;
const LIVE_DATA_TTL_MS = 2 * 60 * 1000;

export interface AllLiveGpsPositionsState {
  positions: Map<string, LiveGpsBatchItem>;
  status: LiveGpsFetchStatus | 'stale' | 'expired';
  lastUpdatedAt: number | null;
}

export function useAllLiveGpsPositionsState(): AllLiveGpsPositionsState {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [now, setNow] = useState(() => Date.now());
  const query = useQuery({
    queryKey: ['gps', 'live', accessToken ? 'authenticated' : 'anonymous'],
    queryFn: () => getAllLiveGpsPositions(accessToken ?? null),
    staleTime: POLL_INTERVAL_MS,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const lastUpdatedAt = query.dataUpdatedAt > 0 ? query.dataUpdatedAt : null;
  const expired = lastUpdatedAt === null || now - lastUpdatedAt > LIVE_DATA_TTL_MS;
  const positions = useMemo(
    () =>
      expired
        ? new Map<string, LiveGpsBatchItem>()
        : new Map((query.data ?? []).map((item) => [item.vehicleKey, item])),
    [expired, query.data],
  );

  let status: AllLiveGpsPositionsState['status'];
  if (expired) {
    status = 'expired';
  } else if (query.error instanceof LiveGpsFetchError && query.data) {
    status = 'stale';
  } else if (query.error instanceof LiveGpsFetchError) {
    status = query.error.fetchStatus;
  } else if (query.data?.length === 0) {
    status = 'success-empty';
  } else {
    status = 'success';
  }

  return { positions, status, lastUpdatedAt };
}

// Both map consumers use this hook, but TanStack Query deduplicates the HTTP
// request and keeps one freshness/error state for the whole map.
export function useAllLiveGpsPositions(): Map<string, LiveGpsBatchItem> {
  return useAllLiveGpsPositionsState().positions;
}
