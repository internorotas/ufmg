import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CategoriaLinhas } from '@/types/data.types';
import { fetchLinhas, fetchParadas } from './transitApi';

describe('transitApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchLinhas retorna CategoriaLinhas compatível', async () => {
    const linhasPayload: CategoriaLinhas = {
      categoriasDias: [
        {
          id: 1,
          categoriaDia: 'diasUteis',
          displayName: 'Dias úteis',
          linhas: [],
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => linhasPayload,
      }),
    );

    const result = await fetchLinhas();
    expect(result).toEqual(linhasPayload);
  });

  it('fetchParadas retorna payload compatível com ParadasPayload', async () => {
    const paradasPayload = {
      paradas: [
        {
          idParada: 'P01',
          nome: 'Praça de Serviços',
          linhasAtendidas: ['DU10'],
          categoria: 'interna',
          descricao: 'Parada principal',
          coordenadas: [-19.86, -43.96],
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => paradasPayload,
      }),
    );

    const result = await fetchParadas();
    expect(result).toEqual(paradasPayload);
  });

  it('erro HTTP lança exceção com status e endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    await expect(fetchLinhas()).rejects.toThrow('Erro HTTP 503 em /v1/linhas');
  });

  it('erro 502 inclui orientação de backend indisponível', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
      }),
    );

    await expect(fetchLinhas()).rejects.toThrow('Proxy do Vite não alcançou o backend');
  });
});
