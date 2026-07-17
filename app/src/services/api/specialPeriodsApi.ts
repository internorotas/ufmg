import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';

export interface SpecialPeriodApiItem {
  nome: string;
  tipo: 'ferias' | 'recesso' | 'mineirao' | 'evento' | 'feriado';
  dataInicio: string;
  dataFim: string;
}

export async function fetchSpecialPeriods(): Promise<SpecialPeriodApiItem[]> {
  const endpoint = resolveApiEndpoint('/v1/transit/special-periods');
  const headers = withTenantHeaders({ Accept: 'application/json' });

  const response = await fetch(endpoint, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
    headers,
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status} ao buscar períodos especiais`);
  }

  const body = (await response.json()) as { periodos: SpecialPeriodApiItem[] };
  return body.periodos;
}
