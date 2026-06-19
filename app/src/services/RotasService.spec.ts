/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/data/linhas', () => ({
  default: { categoriasDias: [] },
}));

vi.mock('@/data/paradas', () => ({
  default: { paradas: [] },
}));

describe('RotasService fallback chain', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('com API respondendo, loadRotasData usa dados da API', async () => {
    vi.doMock('@/services/api/transitApi', () => ({
      fetchTransitDataBinary: vi
        .fn()
        .mockResolvedValue({ linhas: { categoriasDias: [] }, paradas: [] }),
    }));

    const { loadRotasData } = await import('./RotasService');
    const result = await loadRotasData();

    expect(result.source).toBe('api');
    expect(result.service.getTodasLinhas()).toEqual({ categoriasDias: [] });
  });

  it('com API indisponível, fallback para source-fallback funciona', async () => {
    vi.doMock('@/services/api/transitApi', () => ({
      fetchTransitDataBinary: vi.fn().mockRejectedValue(new Error('api off')),
    }));

    const { loadRotasData } = await import('./RotasService');
    const result = await loadRotasData();

    expect(result.source).toBe('source-fallback');
  });

  it('em DEV, fallback TS source continua funcional', async () => {
    vi.doMock('@/services/api/transitApi', () => ({
      fetchTransitDataBinary: vi.fn().mockRejectedValue(new Error('api off')),
    }));

    const { loadRotasData } = await import('./RotasService');
    const result = await loadRotasData();

    expect(result.source).toBe('source-fallback');
    expect(result.service.getTodasParadas()).toBeDefined();
  });

  it('loadRotasService expõe apenas o service do fluxo consolidado', async () => {
    vi.doMock('@/services/api/transitApi', () => ({
      fetchTransitDataBinary: vi
        .fn()
        .mockResolvedValue({ linhas: { categoriasDias: [] }, paradas: [] }),
    }));

    const { loadRotasService } = await import('./RotasService');
    const service = await loadRotasService();

    expect(service.getTodasLinhas()).toEqual({ categoriasDias: [] });
    expect(service.getTodasParadas()).toEqual([]);
  });
});
