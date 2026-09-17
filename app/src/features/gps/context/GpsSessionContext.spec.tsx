/* @vitest-environment jsdom */

import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@/test/renderUtils';

const gpsMocks = vi.hoisted(() => {
  const stop = vi.fn();

  return {
    stop,
    trackEvent: vi.fn(),
    tracking: {
      label: 'Rastreio',
      isActive: false,
      status: 'error',
      sessionId: null,
      queueSize: 0,
      isSyncing: false,
      nextCollectionIntervalMs: 30_000,
      lastStopReason: null,
      distanceKm: 0,
      durationMs: 0,
      snapshotsCount: 0,
      acceptedPoints: 0,
      rejectedPoints: 0,
      lockedLine: null,
      rateLimitMessage: 'Muitas tentativas. Aguarde um momento.',
      startError: null,
      conflict: null,
      start: vi.fn(),
      stop,
      ingestSnapshot: vi.fn(),
      resolveConflict: vi.fn(),
      dismissConflict: vi.fn(),
    },
  };
});

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/contexts/LocationContext', () => ({
  useLocationContext: () => ({ ultimaLeitura: null, heading: null }),
}));
vi.mock('@/contexts/RotasContext', () => ({
  useRotasSelection: () => ({ linhaSelecionada: null }),
}));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuthContext: () => ({ isAuthenticated: true }),
}));
vi.mock('@/features/gps/hooks/useGpsTrackingSession', () => ({
  useGpsTrackingSession: () => gpsMocks.tracking,
}));
vi.mock('@/features/gps/components/GpsActiveSessionConflictDialog', () => ({
  GpsActiveSessionConflictDialog: () => null,
}));
vi.mock('@/features/gps/components/GpsTrackingCard', () => ({
  GpsTrackingCard: () => null,
}));
vi.mock('@/features/gps/components/TripRatingCard', () => ({
  TripRatingCard: () => null,
}));
vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({ trackEvent: gpsMocks.trackEvent }),
}));
vi.mock('@/hooks/useAudioKeepAlive', () => ({
  useAudioKeepAlive: () => undefined,
}));
vi.mock('@/hooks/useWakeLock', () => ({
  useWakeLock: () => undefined,
}));
vi.mock('@/hooks/useHistoricoViagens', () => ({
  VIAGENS_QUERY_KEY: ['viagens'],
}));

import { GpsSessionProvider } from './GpsSessionContext';

describe('GpsSessionProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gpsMocks.tracking.rateLimitMessage = 'Muitas tentativas. Aguarde um momento.';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('fecha o aviso de rate limit sem encerrar o rastreio', () => {
    const view = render(
      <GpsSessionProvider>
        <div>conteudo</div>
      </GpsSessionProvider>,
    );

    const closeButton = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Fechar aviso"]',
    );
    expect(closeButton).not.toBeNull();

    act(() => {
      closeButton?.click();
    });

    expect(gpsMocks.stop).not.toHaveBeenCalled();
    expect(view.container.querySelector('button[aria-label="Fechar aviso"]')).toBeNull();

    view.unmount();
  });
});
