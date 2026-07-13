import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { getViagemHistory, type ViagemHistoryItem } from '@/features/gps/api/gpsClient';

export const VIAGENS_QUERY_KEY = ['viagens'] as const;

export type { ViagemHistoryItem as RegistroViagem };

export interface UseHistoricoViagensReturn {
  historico: ViagemHistoryItem[];
  isLoading: boolean;
}

export function useHistoricoViagens(): UseHistoricoViagensReturn {
  const { isAuthenticated } = useAuthContext();

  const { data, isLoading } = useQuery<ViagemHistoryItem[]>({
    queryKey: VIAGENS_QUERY_KEY,
    queryFn: getViagemHistory,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  return { historico: data ?? [], isLoading };
}
