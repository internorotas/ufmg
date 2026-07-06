import { parse as parseProto } from 'protobufjs';
import { useAuthStore } from '@/features/auth/store/authStore';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';
import type { CategoriaDia, CategoriaLinhas, DadosLinhas, Linha, Parada } from '@/types/data.types';

export interface ParadasPayload {
  paradas: Parada[];
}

function getInMemoryAuthToken(): string | null {
  return useAuthStore.getState().accessToken;
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

// Deduplicação: se duas queries dispararem ao mesmo tempo (linhas + paradas),
// compartilham a mesma Promise em vez de fazer dois requests idênticos.
let _pendingTransitData: Promise<{ linhas: CategoriaLinhas; paradas: Parada[] }> | null = null;

let _currentTransitToken: string | null = null;

export function setCurrentTransitToken(token: string | null): void {
  _currentTransitToken = token;
}

export function getCurrentTransitToken(): string | null {
  return _currentTransitToken;
}

async function doFetchTransitDataBinary(
  transitToken?: string,
): Promise<{ linhas: CategoriaLinhas; paradas: Parada[] }> {
  const effectiveToken = transitToken ?? _currentTransitToken;
  const endpoint = resolveApiEndpoint('/v1/transit/data');
  const authToken = getInMemoryAuthToken();
  const headers = withTenantHeaders({
    Accept: 'application/x-protobuf',
    ...(effectiveToken ? { 'X-Transit-Token': effectiveToken } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  });

  const response = await fetch(endpoint, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status} ao buscar dados de trânsito`);
  }

  const buffer = await response.arrayBuffer();
  return decodeTransitProto(buffer);
}

export function fetchTransitDataBinary(
  transitToken?: string,
): Promise<{ linhas: CategoriaLinhas; paradas: Parada[] }> {
  if (_pendingTransitData) return _pendingTransitData;
  _pendingTransitData = doFetchTransitDataBinary(transitToken).finally(() => {
    _pendingTransitData = null;
  });
  return _pendingTransitData;
}
