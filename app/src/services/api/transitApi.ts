import type { CategoriaLinhas, Parada } from '@/types/data.types';

interface ParadasPayload {
  paradas: Parada[];
}

function resolveTransitEndpoint(pathname: '/v1/linhas' | '/v1/paradas'): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  if (!apiBaseUrl) {
    return pathname;
  }

  return new URL(pathname, apiBaseUrl).toString();
}

function assertLinhasPayload(payload: unknown): asserts payload is CategoriaLinhas {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Resposta de linhas inválida: payload não é objeto.');
  }

  if (!Array.isArray((payload as { categoriasDias?: unknown }).categoriasDias)) {
    throw new Error('Resposta de linhas inválida: categoriasDias ausente ou inválido.');
  }
}

function assertParadasPayload(payload: unknown): asserts payload is ParadasPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Resposta de paradas inválida: payload não é objeto.');
  }

  if (!Array.isArray((payload as { paradas?: unknown }).paradas)) {
    throw new Error('Resposta de paradas inválida: paradas ausente ou inválido.');
  }
}

async function fetchTransit<T>(pathname: '/v1/linhas' | '/v1/paradas'): Promise<T> {
  const endpoint = resolveTransitEndpoint(pathname);
  const response = await fetch(endpoint, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Falha ao buscar ${pathname}: HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchLinhas(): Promise<CategoriaLinhas> {
  const payload = await fetchTransit<unknown>('/v1/linhas');
  assertLinhasPayload(payload);
  return payload;
}

export async function fetchParadas(): Promise<ParadasPayload> {
  const payload = await fetchTransit<unknown>('/v1/paradas');
  assertParadasPayload(payload);
  return payload;
}
