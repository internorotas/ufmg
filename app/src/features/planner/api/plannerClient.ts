import { useAuthStore } from '@/features/auth/store/authStore';
import type { PlannerClientQuery, PlannerRoutesResponse } from '../types';

function resolvePlannerEndpoint(): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  if (!apiBaseUrl) {
    return '/v1/planner/routes';
  }

  return new URL('/v1/planner/routes', apiBaseUrl).toString();
}

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
  const url = new URL(resolvePlannerEndpoint(), window.location.origin);
  url.searchParams.set('originStopId', query.originStopId);
  url.searchParams.set('destinationStopId', query.destinationStopId);
  if (query.categoryDay) {
    url.searchParams.set('categoryDay', query.categoryDay);
  }

  const authToken = useAuthStore.getState().accessToken;
  const headers: HeadersInit = {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

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
