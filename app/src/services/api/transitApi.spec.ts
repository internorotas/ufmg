import { parse as parseProto } from 'protobufjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTransitDataBinary } from './transitApi';

const TEST_TRANSIT_PROTO = `
  syntax = "proto3";
  package transitdata;
  message LatLng { double lat = 1; double lng = 2; }
  message Trecho {
    string id_parada = 1;
    double tempo_do_anterior_minutos = 2;
    bool is_trecho_externo = 3;
  }
  message Linha {
    string id_rota = 1;
    int32 linha = 2;
    string nome = 3;
    string tipo = 4;
    optional string sublinha = 5;
    string categoria_dia = 6;
    string cor_hex = 7;
    string descricao = 8;
    repeated string horarios = 9;
    repeated string itinerario_paradas_ids = 10;
    repeated LatLng coordenadas_trajeto = 11;
    repeated Trecho trajeto_detalhado = 12;
  }
  message DadosLinhas {
    int32 id = 1;
    string categoria_dia = 2;
    string display_name = 3;
    bool exibir = 4;
    repeated Linha linhas = 5;
  }
  message CategoriaLinhas { repeated DadosLinhas categorias_dias = 1; }
  message TransitData { CategoriaLinhas linhas = 1; }
`;

function encodeTransitFixture(): ArrayBuffer {
  const root = parseProto(TEST_TRANSIT_PROTO).root;
  const TransitData = root.lookupType('transitdata.TransitData');
  const message = TransitData.create({
    linhas: {
      categoriasDias: [
        {
          id: 1,
          categoriaDia: 'diasUteis',
          displayName: 'Dias úteis',
          exibir: true,
          linhas: [
            {
              idRota: 'L1',
              linha: 1,
              nome: 'Linha 1',
              tipo: 'regular',
              categoriaDia: 'diasUteis',
              corHex: '#000000',
              descricao: 'Teste',
              horarios: ['08:00'],
              itinerarioParadasIds: ['P1'],
              coordenadasTrajeto: [{ lat: -19.87, lng: -43.96 }],
              trajetoDetalhado: [
                {
                  idParada: 'P1',
                  tempoDoAnteriorMinutos: 5,
                  isTrechoExterno: true,
                },
              ],
            },
          ],
        },
      ],
    },
  });

  const bytes = TransitData.encode(message).finish();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

describe('transitApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchTransitDataBinary lança erro em resposta HTTP não-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    await expect(fetchTransitDataBinary()).rejects.toThrow('Erro HTTP 503');
  });

  it('fetchTransitDataBinary deduplica requisições concorrentes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal('fetch', fetchMock);

    await Promise.allSettled([fetchTransitDataBinary(), fetchTransitDataBinary()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('preserva isTrechoExterno no contrato protobuf', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        arrayBuffer: vi.fn().mockResolvedValue(encodeTransitFixture()),
      }),
    );

    const result = await fetchTransitDataBinary();
    const trecho = result.linhas.categoriasDias[0]?.linhas[0]?.trajetoDetalhado?.[0];

    expect(trecho?.isTrechoExterno).toBe(true);
  });
});
