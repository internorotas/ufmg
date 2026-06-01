import { useAuthStore } from '@/features/auth/store/authStore';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';
import type { PlannerClientQuery, PlannerRoutesResponse } from '../types';

export class PlannerRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
  ) {
    super(message);
    this.name = 'PlannerRequestError';
  }
}

export async function fetchPlannerRoutes(
  query: PlannerClientQuery,
): Promise<PlannerRoutesResponse> {
  const url = new URL(resolveApiEndpoint('/v1/planner/routes'), window.location.origin);
  url.searchParams.set('originStopId', query.originStopId);
  url.searchParams.set('destinationStopId', query.destinationStopId);
  if (query.categoryDay) {
    url.searchParams.set('categoryDay', query.categoryDay);
  }

  const authToken = useAuthStore.getState().accessToken;
  const baseHeaders: HeadersInit = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const headers = withTenantHeaders(baseHeaders);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha de rede ao calcular rotas';
    throw new PlannerRequestError(message, null);
  }

  if (!response.ok) {
    throw new PlannerRequestError(
      `Falha ao calcular rotas: HTTP ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<PlannerRoutesResponse>;
}
