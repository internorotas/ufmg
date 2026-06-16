import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OsrmRoutingService } from './OsrmRoutingService';

const service = new OsrmRoutingService();

const mockStops: [number, number][] = [
  [-19.9245, -43.9352],
  [-19.9167, -43.9345],
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('OsrmRoutingService.getRoute', () => {
  it('returns [lat, lng] pairs converting from GeoJSON [lng, lat]', async () => {
    const geoJsonCoords: [number, number][] = [
      [-43.9352, -19.9245],
      [-43.936, -19.92],
      [-43.9345, -19.9167],
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          routes: [{ geometry: { coordinates: geoJsonCoords } }],
        }),
      }),
    );

    const result = await service.getRoute(mockStops);

    expect(result).toEqual([
      [-19.9245, -43.9352],
      [-19.92, -43.936],
      [-19.9167, -43.9345],
    ]);
  });

  it('throws when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    await expect(service.getRoute(mockStops)).rejects.toThrow('OSRM 500');
  });

  it('throws when routes array is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ routes: [] }),
      }),
    );

    await expect(service.getRoute(mockStops)).rejects.toThrow('OSRM sem coordenadas');
  });

  it('calls fetch with coordinates in lng,lat order', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [{ geometry: { coordinates: [[-43.9352, -19.9245]] } }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await service.getRoute(mockStops);

    const calledUrl: string = fetchMock.mock.calls[0][0];
    // lng,lat order: -43.9352,-19.9245 and -43.9345,-19.9167
    expect(calledUrl).toContain('-43.9352,-19.9245;-43.9345,-19.9167');
  });
});
