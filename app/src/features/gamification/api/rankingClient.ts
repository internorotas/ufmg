import { getAuthHeaders } from '@/features/auth/api/authClient';

export type RankingPeriod = 'semanal' | 'mensal' | 'all_time';
export type RankingScope = 'geral' | 'campus' | `linha:${string}`;

export interface RankingEntry {
  displayName: string;
  score: number;
}

export interface PublicRankingResponse {
  period: RankingPeriod;
  scope: RankingScope;
  top: RankingEntry[];
}

export interface AuthenticatedRankingResponse {
  period: RankingPeriod;
  scope: RankingScope;
  entries: RankingEntry[];
  currentUser: {
    displayName: string;
    score: number;
    rank: number;
  } | null;
}

function createRankingUrl(
  path: '/v1/gamification/rankings/public' | '/v1/gamification/rankings/me',
  params: {
    period: RankingPeriod;
    scope: RankingScope;
  },
) {
  const apiBaseUrl = import.meta.env.VITE_API_URL;
  const url = new URL(
    path,
    apiBaseUrl ? new URL(apiBaseUrl, window.location.origin) : window.location.origin,
  );
  url.searchParams.set('period', params.period);
  url.searchParams.set('scope', params.scope);
  return url.toString();
}

export async function getPublicRanking(params: {
  period: RankingPeriod;
  scope: RankingScope;
}): Promise<PublicRankingResponse> {
  const response = await fetch(createRankingUrl('/v1/gamification/rankings/public', params), {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar ranking público: HTTP ${response.status}`);
  }

  return response.json() as Promise<PublicRankingResponse>;
}

export async function getAuthenticatedRanking(params: {
  period: RankingPeriod;
  scope: RankingScope;
}): Promise<AuthenticatedRankingResponse> {
  const headers = getAuthHeaders();
  if (!headers) {
    throw new Error('Sessão autenticada ausente');
  }

  const response = await fetch(createRankingUrl('/v1/gamification/rankings/me', params), {
    method: 'GET',
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar ranking autenticado: HTTP ${response.status}`);
  }

  return response.json() as Promise<AuthenticatedRankingResponse>;
}
