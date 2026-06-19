import { parse as parseProto } from 'protobufjs';
import localLinhas from '@/data/linhas';
import localParadas from '@/data/paradas';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getTenantStorageKey } from '@/pwa/tenantNamespace';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';
import type { CategoriaDia, CategoriaLinhas, DadosLinhas, Linha, Parada } from '@/types/data.types';

export interface ParadasPayload {
  paradas: Parada[];
}

const API_VERSION_STORAGE_KEY = getTenantStorageKey('api-version');

function getExpectedApiVersion(): string {
  return import.meta.env.VITE_API_VERSION?.trim() || 'v1';
}

function resolveTransitEndpoint(pathname: '/v1/linhas' | '/v1/paradas'): string {
  return resolveApiEndpoint(pathname);
}

function getInMemoryAuthToken(): string | null {
  return useAuthStore.getState().accessToken;
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

async function fetchTransit<T>(
  pathname: '/v1/linhas' | '/v1/paradas',
  parser: (value: unknown) => T,
): Promise<T> {
  const endpoint = resolveTransitEndpoint(pathname);
  const authToken = getInMemoryAuthToken();
  const headers = withTenantHeaders({
    Accept: 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Não foi possível conectar ao backend (${endpoint}). Verifique se a API está ativa em ${getApiBaseUrl() || 'proxy /v1'}. Detalhe: ${detail}`,
    );
  }

  clearTimeout(timeoutId);

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
  try {
    return await fetchTransit('/v1/linhas', ensureCategoriaLinhasShape);
  } catch {
    return localLinhas;
  }
}

export async function fetchParadas(): Promise<ParadasPayload> {
  try {
    return await fetchTransit('/v1/paradas', ensureParadasPayloadShape);
  } catch {
    return localParadas;
  }
}

const TRANSIT_PROTO = `
  syntax = "proto3";
  package transitdata;
  message LatLng { double lat = 1; double lng = 2; }
  message Trecho {
    string id_parada = 1; double tempo_do_anterior_minutos = 2; bool is_trecho_externo = 3;
  }
  message Linha {
    string id_rota = 1; int32 linha = 2; string nome = 3; string tipo = 4;
    optional string sublinha = 5; string categoria_dia = 6; string cor_hex = 7; string descricao = 8;
    repeated string horarios = 9; repeated string itinerario_paradas_ids = 10;
    repeated LatLng coordenadas_trajeto = 11; repeated Trecho trajeto_detalhado = 12;
  }
  message DadosLinhas {
    int32 id = 1; string categoria_dia = 2; string display_name = 3;
    bool exibir = 4; repeated Linha linhas = 5;
  }
  message CategoriaLinhas { repeated DadosLinhas categorias_dias = 1; }
  message Parada {
    string id_parada = 1; string nome = 2; repeated string linhas_atendidas = 3;
    string categoria = 4; string descricao = 5; double lat = 6; double lng = 7;
  }
  message TransitData { CategoriaLinhas linhas = 1; repeated Parada paradas = 2; }
`;

let _protoRoot: ReturnType<typeof parseProto>['root'] | null = null;
function getProtoRoot() {
  if (!_protoRoot) _protoRoot = parseProto(TRANSIT_PROTO).root;
  return _protoRoot;
}

interface ProtoParada {
  idParada: string;
  nome: string;
  linhasAtendidas: string[];
  categoria: string;
  descricao: string;
  lat: number;
  lng: number;
}

interface ProtoLinha {
  idRota: string;
  linha: number;
  nome: string;
  tipo: string;
  sublinha?: string;
  categoriaDia: string;
  corHex: string;
  descricao: string;
  horarios: string[];
  itinerarioParadasIds: string[];
  coordenadasTrajeto: Array<{ lat: number; lng: number }>;
  trajetoDetalhado: Array<{ idParada: string; tempoDoAnteriorMinutos: number }>;
}

interface ProtoDadosLinhas {
  id: number;
  categoriaDia: string;
  displayName: string;
  exibir: boolean;
  linhas: ProtoLinha[];
}

interface ProtoTransitData {
  linhas: { categoriasDias: ProtoDadosLinhas[] };
  paradas: ProtoParada[];
}

function decodeTransitProto(buffer: ArrayBuffer): {
  linhas: CategoriaLinhas;
  paradas: Parada[];
} {
  const root = getProtoRoot();
  const TransitData = root.lookupType('transitdata.TransitData');
  const decoded = TransitData.decode(new Uint8Array(buffer)) as unknown as ProtoTransitData;

  const linhas: CategoriaLinhas = {
    categoriasDias: (decoded.linhas?.categoriasDias ?? []).map(
      (cat): DadosLinhas => ({
        id: cat.id,
        categoriaDia: cat.categoriaDia as CategoriaDia,
        displayName: cat.displayName,
        exibir: cat.exibir,
        linhas: (cat.linhas ?? []).map(
          (l): Linha => ({
            idRota: l.idRota,
            linha: l.linha,
            nome: l.nome,
            tipo: l.tipo,
            sublinha: l.sublinha ?? null,
            categoriaDia: l.categoriaDia as CategoriaDia,
            corHex: l.corHex,
            descricao: l.descricao,
            horarios: l.horarios ?? [],
            itinerarioParadasIds: l.itinerarioParadasIds ?? [],
            coordenadasTrajeto: (l.coordenadasTrajeto ?? []).map(
              (c) => [c.lat, c.lng] as [number, number],
            ),
            trajetoDetalhado: (l.trajetoDetalhado ?? []).map((t) => ({
              idParada: t.idParada,
              tempoDoAnteriorMinutos: t.tempoDoAnteriorMinutos,
            })),
          }),
        ),
      }),
    ),
  };

  const paradas: Parada[] = (decoded.paradas ?? []).map((p) => ({
    idParada: p.idParada,
    nome: p.nome,
    linhasAtendidas: p.linhasAtendidas ?? [],
    categoria: p.categoria,
    descricao: p.descricao,
    coordenadas: [p.lat, p.lng] as [number, number],
  }));

  return { linhas, paradas };
}

export async function fetchTransitDataBinary(
  transitToken?: string,
): Promise<{ linhas: CategoriaLinhas; paradas: Parada[] }> {
  const endpoint = resolveApiEndpoint('/v1/transit/data');
  const authToken = getInMemoryAuthToken();
  const headers = withTenantHeaders({
    Accept: 'application/x-protobuf',
    ...(transitToken ? { 'X-Transit-Token': transitToken } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  });

  const response = await fetch(endpoint, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status} em ${endpoint}`);
  }

  const buffer = await response.arrayBuffer();
  return decodeTransitProto(buffer);
}
