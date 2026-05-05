import type { CategoriaLinhas, Parada } from '@/types/data.types';

export interface ParadasPayload {
  paradas: Parada[];
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000';
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function ensureCategoriaLinhasShape(value: unknown): CategoriaLinhas {
  if (
    !value ||
    typeof value !== 'object' ||
    !('categoriasDias' in value) ||
    !Array.isArray((value as { categoriasDias: unknown }).categoriasDias)
  ) {
    throw new Error('Resposta inválida para /v1/linhas');
  }

  return value as CategoriaLinhas;
}

function ensureParadasPayloadShape(value: unknown): ParadasPayload {
  if (!value || typeof value !== 'object' || !('paradas' in value)) {
    throw new Error('Resposta inválida para /v1/paradas');
  }

  const paradas = (value as { paradas: unknown }).paradas;
  if (!Array.isArray(paradas)) {
    throw new Error('Resposta inválida para /v1/paradas');
  }

  return { paradas: paradas as Parada[] };
}

async function fetchWithContract<T>(endpoint: string, parser: (value: unknown) => T): Promise<T> {
  const baseUrl = normalizeBaseUrl(getApiBaseUrl());
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status} em ${endpoint}`);
  }

  const payload = (await response.json()) as unknown;
  return parser(payload);
}

export async function fetchLinhas(): Promise<CategoriaLinhas> {
  return fetchWithContract('/v1/linhas', ensureCategoriaLinhasShape);
}

export async function fetchParadas(): Promise<ParadasPayload> {
  return fetchWithContract('/v1/paradas', ensureParadasPayloadShape);
}
