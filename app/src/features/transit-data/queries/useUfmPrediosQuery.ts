import { useQuery } from '@tanstack/react-query';
import type { GeoJsonFeatureCollection } from '@/services/api/mapDataApi';
import { fetchUfmPredios } from '@/services/api/mapDataApi';
import { tenantSlug } from '@/tenants/tenantConfig';

export const mapQueryKeys = {
  all: ['map'] as const,
  ufmPredios: ['map', tenantSlug, 'ufm-predios'] as const,
};

const MAP_DATA_STALE_TIME_MS = 60 * 60 * 1000;
const MAP_DATA_GC_TIME_MS = 60 * 60 * 1000;

export function useUfmPrediosQuery() {
  return useQuery<GeoJsonFeatureCollection>({
    queryKey: mapQueryKeys.ufmPredios,
    queryFn: fetchUfmPredios,
    staleTime: MAP_DATA_STALE_TIME_MS,
    gcTime: MAP_DATA_GC_TIME_MS,
    retry: 2,
    networkMode: 'offlineFirst',
  });
}
