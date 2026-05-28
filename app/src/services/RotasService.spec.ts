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
      fetchLinhas: vi.fn().mockResolvedValue({ categoriasDias: [] }),
      fetchParadas: vi.fn().mockResolvedValue({ paradas: [] }),
    }));

    const { loadRotasData } = await import('./RotasService');
    const result = await loadRotasData();

    expect(result.source).toBe('api');
    expect(result.service.getTodasLinhas()).toEqual({ categoriasDias: [] });
  });

  it('com API indisponível, fallback para /public/data funciona', async () => {
    vi.doMock('@/services/api/transitApi', () => ({
      fetchLinhas: vi.fn().mockRejectedValue(new Error('api off')),
      fetchParadas: vi.fn().mockRejectedValue(new Error('api off')),
    }));

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ categoriasDias: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ paradas: [] }) }),
    );

    const { loadRotasData } = await import('./RotasService');
    const result = await loadRotasData();

    expect(result.source).toBe('public-data');
  });

  it('em DEV sem /public/data, fallback TS source continua funcional', async () => {
    vi.doMock('@/services/api/transitApi', () => ({
      fetchLinhas: vi.fn().mockRejectedValue(new Error('api off')),
      fetchParadas: vi.fn().mockRejectedValue(new Error('api off')),
    }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: false }),
    );

    const { loadRotasData } = await import('./RotasService');
    const result = await loadRotasData();

    expect(result.source).toBe('source-fallback');
    expect(result.service.getTodasParadas()).toBeDefined();
  });

  it('loadRotasService expõe apenas o service do fluxo consolidado', async () => {
    vi.doMock('@/services/api/transitApi', () => ({
      fetchLinhas: vi.fn().mockResolvedValue({ categoriasDias: [] }),
      fetchParadas: vi.fn().mockResolvedValue({ paradas: [] }),
    }));

    const { loadRotasService } = await import('./RotasService');
    const service = await loadRotasService();

    expect(service.getTodasLinhas()).toEqual({ categoriasDias: [] });
    expect(service.getTodasParadas()).toEqual([]);
  });
});
