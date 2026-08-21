/* @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { LiveGpsBatchItem } from '@/features/gps/api/gpsClient';

const getAllLiveGpsPositionsMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/gps/api/gpsClient', () => ({
  getAllLiveGpsPositions: getAllLiveGpsPositionsMock,
  LiveGpsFetchError: class LiveGpsFetchError extends Error {},
}));

function makePosition(vehicleKey: string): LiveGpsBatchItem {
  return {
    linhaId: '5102',
    lat: -19.87,
    lng: -43.96,
    speedKmh: 22.5,
    heading: 90,
    routeProgress: 0.42,
    confidence: 0.9,
    updatedAt: '2026-01-01T00:00:00.000Z',
    delayed: false,
    vehicleKey,
    clusterKey: vehicleKey,
  };
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useAllLiveGpsPositionsState', () => {
  beforeEach(() => {
    getAllLiveGpsPositionsMock.mockReset();
    useAuthStore.getState().setAnonymousSession();
  });

  it('deduplica consumidores do mapa e compartilha posições por vehicleKey', async () => {
    const { useAllLiveGpsPositionsState } = await import('./useAllLiveGpsPositions');
    const position = makePosition('vehicle-1');
    getAllLiveGpsPositionsMock.mockResolvedValue([position]);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = createWrapper(queryClient);

    const first = renderHook(() => useAllLiveGpsPositionsState(), { wrapper });
    const second = renderHook(() => useAllLiveGpsPositionsState(), { wrapper });

    await waitFor(() => expect(first.result.current.status).toBe('success'));

    expect(getAllLiveGpsPositionsMock).toHaveBeenCalledTimes(1);
    expect(getAllLiveGpsPositionsMock).toHaveBeenCalledWith(false, expect.any(AbortSignal));
    expect(first.result.current.positions.get('vehicle-1')).toEqual(position);
    expect(second.result.current.positions.get('vehicle-1')).toEqual(position);

    first.unmount();
    second.unmount();
    queryClient.clear();
  });

  it('usa o modo autenticado sem duplicar o token no queryFn', async () => {
    const { useAllLiveGpsPositionsState } = await import('./useAllLiveGpsPositions');
    useAuthStore.getState().setAuthenticatedSession({ accessToken: 'jwt-test', user: null });
    getAllLiveGpsPositionsMock.mockResolvedValue([]);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, unmount } = renderHook(() => useAllLiveGpsPositionsState(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.status).toBe('success-empty'));

    expect(getAllLiveGpsPositionsMock).toHaveBeenCalledWith(true, expect.any(AbortSignal));
    unmount();
    queryClient.clear();
  });

  it('cancela a requisição pendente quando o último consumidor sai', async () => {
    const { useAllLiveGpsPositionsState } = await import('./useAllLiveGpsPositions');
    let receivedSignal: AbortSignal | undefined;
    getAllLiveGpsPositionsMock.mockImplementation(
      (_isAuthenticated: boolean, signal: AbortSignal) => {
        receivedSignal = signal;
        return new Promise<never>(() => {});
      },
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { unmount } = renderHook(() => useAllLiveGpsPositionsState(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(getAllLiveGpsPositionsMock).toHaveBeenCalled());
    unmount();

    expect(receivedSignal?.aborted).toBe(true);
    queryClient.clear();
  });
});
