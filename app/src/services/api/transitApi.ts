import type { CategoriaLinhas, Parada } from '@/types/data.types';

export interface ParadasPayload {
  paradas: Parada[];
}

const API_VERSION_STORAGE_KEY = 'ufmg:api-version';

function getExpectedApiVersion(): string {
  return import.meta.env.VITE_API_VERSION?.trim() || 'v1';
}

function getStoredApiVersion(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(API_VERSION_STORAGE_KEY);
}

function setStoredApiVersion(version: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(API_VERSION_STORAGE_KEY, version);
}

function triggerApiVersionReload(incomingVersion: string, expectedVersion: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const previousVersion = getStoredApiVersion();
  const mismatchAlreadyHandled = previousVersion === incomingVersion;

  setStoredApiVersion(incomingVersion);

  if (mismatchAlreadyHandled) {
    return;
  }

  // biome-ignore lint/suspicious/noConsole: log intencional para diagnóstico de incompatibilidade de API
  console.warn(
    `Versão da API incompatível (esperada ${expectedVersion}, recebida ${incomingVersion}). Atualizando a página...`,
  );

  window.dispatchEvent(new CustomEvent('internorotas:api-version-mismatch'));
}

function ensureApiVersion(response: Response): void {
  if (!response.headers || typeof response.headers.get !== 'function') {
    return;
  }

  const expectedVersion = getExpectedApiVersion();
  const incomingVersion = response.headers.get('X-API-Version');

  if (!incomingVersion) {
    return;
  }

  if (incomingVersion !== expectedVersion) {
    triggerApiVersionReload(incomingVersion, expectedVersion);
    throw new Error(
      `Versão incompatível da API: esperado ${expectedVersion}, recebido ${incomingVersion}`,
    );
  }

  if (incomingVersion !== getStoredApiVersion()) {
    setStoredApiVersion(incomingVersion);
  }
}

function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return '';
  }

  const explicitApiUrl = import.meta.env.VITE_API_URL?.trim();
  if (explicitApiUrl) {
    return explicitApiUrl;
  }

  return 'http://localhost:43111';
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

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Não foi possível conectar ao backend (${url}). Verifique se a API está ativa em http://localhost:43111. Detalhe: ${detail}`,
    );
  }

  if (!response.ok) {
    if (response.status === 502) {
      throw new Error(
        `Proxy do Vite não alcançou o backend em http://localhost:43111 (${endpoint}). Inicie a API e recarregue a página.`,
      );
    }

    throw new Error(`Erro HTTP ${response.status} em ${endpoint}`);
  }

  ensureApiVersion(response);

  const payload = (await response.json()) as unknown;
  return parser(payload);
}

export async function fetchLinhas(): Promise<CategoriaLinhas> {
  return fetchWithContract('/v1/linhas', ensureCategoriaLinhasShape);
}

export async function fetchParadas(): Promise<ParadasPayload> {
  return fetchWithContract('/v1/paradas', ensureParadasPayloadShape);
}
