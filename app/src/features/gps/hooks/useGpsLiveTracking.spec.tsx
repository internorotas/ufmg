/* @vitest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}

function createFakeSocket() {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const managerListeners = new Map<string, Set<(...args: unknown[]) => void>>();

  const socket = {
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)?.add(cb);
    }),
    off: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(cb);
    }),
    disconnect: vi.fn(),
    io: {
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        if (!managerListeners.has(event)) managerListeners.set(event, new Set());
        managerListeners.get(event)?.add(cb);
      }),
      off: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        managerListeners.get(event)?.delete(cb);
      }),
    },
    __emit(event: string, ...args: unknown[]) {
      for (const cb of listeners.get(event) ?? []) cb(...args);
    },
    __emitManager(event: string, ...args: unknown[]) {
      for (const cb of managerListeners.get(event) ?? []) cb(...args);
    },
  };

  return socket;
}

describe('useGpsLiveTracking', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.stubEnv('VITE_API_URL', 'https://api.example.test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('anônimo: faz bootstrap HTTP imediato e nunca chama io()', async () => {
    const ioMock = vi.fn();
    vi.doMock('socket.io-client', () => ({ io: ioMock }));
    vi.doMock('@/features/auth/store/authStore', () => ({
      useAuthStore: (selector: (s: { accessToken: string | null }) => unknown) =>
        selector({ accessToken: null }),
    }));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          lat: -19.87,
          lng: -43.96,
          heading: 90,
          confidence: 0.9,
          updatedAt: new Date().toISOString(),
        }),
      ),
    );

    const { useGpsLiveTracking } = await import('./useGpsLiveTracking');
    const { result, unmount } = renderHook(() => useGpsLiveTracking('5102'));

    await waitFor(() => expect(result.current.position).not.toBeNull());
    expect(ioMock).not.toHaveBeenCalled();
    unmount();
  });

  it('autenticado: handshake usa auth.token + query.tenantSlug, nunca extraHeaders', async () => {
    const fakeSocket = createFakeSocket();
    const ioMock = vi.fn().mockReturnValue(fakeSocket);
    vi.doMock('socket.io-client', () => ({ io: ioMock }));
    vi.doMock('@/features/auth/store/authStore', () => ({
      useAuthStore: (selector: (s: { accessToken: string | null }) => unknown) =>
        selector({ accessToken: 'jwt-abc' }),
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(404, null)));

    const { useGpsLiveTracking } = await import('./useGpsLiveTracking');
    const { unmount } = renderHook(() => useGpsLiveTracking('5102'));

    await waitFor(() => expect(ioMock).toHaveBeenCalled());
    const [namespaceUrl, options] = ioMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(namespaceUrl).toBe('https://api.example.test/gps');
    expect(options.auth).toEqual({ token: 'jwt-abc' });
    expect(options.query).toEqual({ tenantSlug: expect.any(String) });
    expect(options).not.toHaveProperty('extraHeaders');
    unmount();
  });

  it('escuta linha:<linhaId> — nunca tenant:<slug>:linha:<id>', async () => {
    const fakeSocket = createFakeSocket();
    vi.doMock('socket.io-client', () => ({ io: vi.fn().mockReturnValue(fakeSocket) }));
    vi.doMock('@/features/auth/store/authStore', () => ({
      useAuthStore: (selector: (s: { accessToken: string | null }) => unknown) =>
        selector({ accessToken: 'jwt-abc' }),
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(404, null)));

    const { useGpsLiveTracking } = await import('./useGpsLiveTracking');
    const { result, unmount } = renderHook(() => useGpsLiveTracking('5102'));

    await waitFor(() => expect(fakeSocket.on).toHaveBeenCalled());
    const registeredEvents = fakeSocket.on.mock.calls.map((call) => call[0]);
    expect(registeredEvents).toContain('linha:5102');
    expect(registeredEvents.some((e) => String(e).startsWith('tenant:'))).toBe(false);

    act(() => {
      fakeSocket.__emit('linha:5102', {
        lat: 1,
        lng: 2,
        heading: null,
        confidence: 1,
        updatedAt: new Date().toISOString(),
      });
    });
    await waitFor(() => expect(result.current.position).not.toBeNull());
    unmount();
  });

  it('404 nunca gera hasConnectionError — GPS ainda indisponível', async () => {
    vi.doMock('socket.io-client', () => ({ io: vi.fn() }));
    vi.doMock('@/features/auth/store/authStore', () => ({
      useAuthStore: (selector: (s: { accessToken: string | null }) => unknown) =>
        selector({ accessToken: null }),
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(404, null)));

    const { useGpsLiveTracking } = await import('./useGpsLiveTracking');
    const { result, unmount } = renderHook(() => useGpsLiveTracking('5102'));

    await waitFor(() => expect(result.current.position).toBeNull());
    expect(result.current.hasConnectionError).toBe(false);
    unmount();
  });

  it('desconexão do socket ativa fallback de polling HTTP', async () => {
    const fakeSocket = createFakeSocket();
    vi.doMock('socket.io-client', () => ({ io: vi.fn().mockReturnValue(fakeSocket) }));
    vi.doMock('@/features/auth/store/authStore', () => ({
      useAuthStore: (selector: (s: { accessToken: string | null }) => unknown) =>
        selector({ accessToken: 'jwt-abc' }),
    }));
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(404, null));
    vi.stubGlobal('fetch', fetchMock);

    const { useGpsLiveTracking } = await import('./useGpsLiveTracking');
    const { unmount } = renderHook(() => useGpsLiveTracking('5102'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    act(() => {
      fakeSocket.__emit('disconnect');
    });

    // Fallback de polling reagenda uma nova chamada HTTP.
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1), {
      timeout: 15_000,
    });
    unmount();
  }, 20_000);

  it('cleanup remove listeners do socket e do Manager e desconecta', async () => {
    const fakeSocket = createFakeSocket();
    vi.doMock('socket.io-client', () => ({ io: vi.fn().mockReturnValue(fakeSocket) }));
    vi.doMock('@/features/auth/store/authStore', () => ({
      useAuthStore: (selector: (s: { accessToken: string | null }) => unknown) =>
        selector({ accessToken: 'jwt-abc' }),
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(404, null)));

    const { useGpsLiveTracking } = await import('./useGpsLiveTracking');
    const { unmount } = renderHook(() => useGpsLiveTracking('5102'));

    await waitFor(() => expect(fakeSocket.on).toHaveBeenCalled());
    unmount();

    expect(fakeSocket.disconnect).toHaveBeenCalled();
    expect(fakeSocket.off).toHaveBeenCalled();
    expect(fakeSocket.io.off).toHaveBeenCalled();
  });
});
