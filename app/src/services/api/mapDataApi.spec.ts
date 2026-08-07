import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchUfmPredios } from './mapDataApi';

describe('mapDataApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('envia o tenant no request do mapa público', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ type: 'FeatureCollection', features: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchUfmPredios()).resolves.toEqual({
      type: 'FeatureCollection',
      features: [],
    });

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(request.headers).get('x-tenant-slug')).toBe('ufmg');
  });
});
