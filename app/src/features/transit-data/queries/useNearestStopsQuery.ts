import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';
import { getCurrentTransitToken } from '@/services/api/transitApi';
import { decryptGeoPayload } from '@/services/api/transitGeo';
import type { Parada } from '@/types/data.types';
import { transitQueryKeys } from './queryKeys';

async function fetchNearestStops(lat: number, lng: number, limit: number): Promise<Parada[]> {
  const transitToken = getCurrentTransitToken();
  const accessToken = useAuthStore.getState().accessToken;
  const url = resolveApiEndpoint(`/v1/stops/nearest?lat=${lat}&lng=${lng}&limit=${limit}`);
  const res = await fetch(url, {
    headers: withTenantHeaders({
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(transitToken ? { 'X-Transit-Token': transitToken } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error('Não foi possível buscar as paradas próximas.');
  }

  const json = (await res.json()) as { p: string };
  return transitToken ? await decryptGeoPayload<Parada[]>(json.p, transitToken) : [];
}

/**
 * Paradas mais próximas de uma coordenada, ordenadas por distância (PostGIS).
 * `coords` nulo mantém a query desabilitada — usada na aba "Próximos" antes
 * do usuário conceder localização.
 */
export function useNearestStopsQuery(coords: [number, number] | null, limit = 10) {
  const [lat, lng] = coords ?? [0, 0];

  return useQuery<Parada[], Error>({
    queryKey: transitQueryKeys.nearestStops(lat, lng),
    queryFn: () => fetchNearestStops(lat, lng, limit),
    enabled: coords !== null,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 2,
  });
}
