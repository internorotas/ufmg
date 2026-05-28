import { useMutation } from '@tanstack/react-query';
import type { PlannerClientQuery, PlannerRoutesResponse } from '../types';
import { fetchPlannerRoutes } from './plannerClient';

export function usePlannerRoutes() {
  return useMutation<PlannerRoutesResponse, Error, PlannerClientQuery>({
    mutationFn: (query: PlannerClientQuery) => fetchPlannerRoutes(query),
    retry: 1,
  });
}
