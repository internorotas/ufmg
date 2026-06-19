import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTransitDataBinary } from './transitApi';

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
});
