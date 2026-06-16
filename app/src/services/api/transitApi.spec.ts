import { afterEach, describe, expect, it, vi } from 'vitest';
import localLinhas from '@/data/linhas';
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

  it('erro HTTP retorna dados locais como fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    const result = await fetchLinhas();
    expect(result).toEqual(localLinhas);
  });

  it('erro 502 retorna dados locais como fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
      }),
    );

    const result = await fetchLinhas();
    expect(result).toEqual(localLinhas);
  });
});
