/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

describe('gpsClient live positions', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('validates the live contract and keeps opaque vehicle keys', async () => {
    const body = [
      {
        linhaId: '5102',
        lat: -19.87,
        lng: -43.96,
        speedKmh: 22.5,
        heading: 90,
        routeProgress: 0.42,
        confidence: 0.9,
        updatedAt: '2026-01-01T00:00:00.000Z',
        delayed: false,
        vehicleKey: 'vehicle-hmac-1',
        clusterKey: 'cluster-hmac-1',
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, body));
    vi.stubGlobal('fetch', fetchMock);

    const { getAllLiveGpsPositions } = await import('./gpsClient');

    await expect(getAllLiveGpsPositions(false)).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/gps/live'),
      expect.objectContaining({ headers: expect.anything() }),
    );
  });

  it('usa o wrapper autenticado e encaminha o AbortSignal sem carregar o token', async () => {
    const body = [
      {
        linhaId: '5102',
        lat: -19.87,
        lng: -43.96,
        heading: null,
        confidence: 0.8,
        updatedAt: '2026-01-01T00:00:00.000Z',
        delayed: false,
        vehicleKey: 'vehicle-hmac-1',
        clusterKey: 'vehicle-hmac-1',
      },
    ];
    const authFetch = vi.fn().mockResolvedValue(jsonResponse(200, body));
    const anonymousFetch = vi.fn();
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: authFetch,
    }));
    vi.stubGlobal('fetch', anonymousFetch);

    const signal = new AbortController().signal;
    const { getAllLiveGpsPositions } = await import('./gpsClient');

    await expect(getAllLiveGpsPositions(true, signal)).resolves.toEqual(body);
    expect(authFetch).toHaveBeenCalledWith(
      expect.stringContaining('/gps/live'),
      expect.objectContaining({ signal }),
    );
    expect(anonymousFetch).not.toHaveBeenCalled();
  });

  it('rejects malformed live data instead of turning it into an empty list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, [
          {
            linhaId: '5102',
            lat: -19.87,
            lng: -43.96,
            heading: null,
            confidence: 0.9,
            updatedAt: '2026-01-01T00:00:00.000Z',
            delayed: false,
            vehicleKey: 'vehicle-hmac-1',
          },
        ]),
      ),
    );

    const { getAllLiveGpsPositions, LiveGpsFetchError } = await import('./gpsClient');

    await expect(getAllLiveGpsPositions(false)).rejects.toMatchObject({
      fetchStatus: 'invalid-response',
    });
    await expect(getAllLiveGpsPositions(false)).rejects.toBeInstanceOf(LiveGpsFetchError);
  });

  it('rejeita identificadores privados extras no payload público', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, [
          {
            linhaId: '5102',
            lat: -19.87,
            lng: -43.96,
            heading: null,
            confidence: 0.9,
            updatedAt: '2026-01-01T00:00:00.000Z',
            delayed: false,
            vehicleKey: 'vehicle-hmac-1',
            clusterKey: 'cluster-hmac-1',
            sessionId: 'private-session-id',
          },
        ]),
      ),
    );

    const { getAllLiveGpsPositions } = await import('./gpsClient');

    await expect(getAllLiveGpsPositions(false)).rejects.toMatchObject({
      fetchStatus: 'invalid-response',
    });
  });

  it.each([
    [401, 'unauthorized'],
    [500, 'server-error'],
  ] as const)('preserves operational status %i as %s', async (status, fetchStatus) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(status, null)));
    const { getAllLiveGpsPositions } = await import('./gpsClient');

    await expect(getAllLiveGpsPositions(false)).rejects.toMatchObject({ status, fetchStatus });
  });

  it('exposes Retry-After in the rate-limit state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(429, null, { 'Retry-After': '7' })),
    );
    const { getAllLiveGpsPositions } = await import('./gpsClient');

    await expect(getAllLiveGpsPositions(false)).rejects.toMatchObject({
      status: 429,
      fetchStatus: 'rate-limited',
      retryAfterMs: 7000,
    });
  });

  it('classifies network failure as offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const { getAllLiveGpsPositions } = await import('./gpsClient');

    await expect(getAllLiveGpsPositions(false)).rejects.toMatchObject({
      status: null,
      fetchStatus: 'network-offline',
    });
  });
});

describe('gpsClient — mapeamento de erros públicos do backend', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GPS_LINE_NOT_FOUND (404) mapeia para mensagem amigável e preserva code/requestId', async () => {
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: vi.fn().mockResolvedValue(
        jsonResponse(404, {
          statusCode: 404,
          code: 'GPS_LINE_NOT_FOUND',
          message: 'Linha nao encontrada no tenant.',
          requestId: 'req-1',
        }),
      ),
    }));

    const { startGpsSession, GpsApiError } = await import('./gpsClient');

    await expect(startGpsSession({ linhaId: 'INEXISTENTE' })).rejects.toMatchObject({
      name: 'GpsApiError',
      code: 'GPS_LINE_NOT_FOUND',
      statusCode: 404,
      requestId: 'req-1',
      message: 'Esta linha não foi encontrada.',
    });

    try {
      await startGpsSession({ linhaId: 'INEXISTENTE' });
    } catch (err) {
      expect(err).toBeInstanceOf(GpsApiError);
      // Nunca deve conter o texto livre bruto do backend.
      expect((err as Error).message).not.toBe('Linha nao encontrada no tenant.');
    }
  });

  it.each([
    ['GPS_LINE_SUSPENDED', 403, 'Esta linha está temporariamente suspensa.'],
    ['GPS_SESSION_ALREADY_ACTIVE', 409, 'Você já tem uma sessão de rastreio ativa.'],
    [
      'GPS_CALENDAR_UNAVAILABLE',
      503,
      'Não foi possível confirmar o calendário agora. Tente novamente em instantes.',
    ],
    ['GPS_INTERNAL_ERROR', 500, 'Não foi possível iniciar o rastreio. Tente novamente.'],
  ])('%s (%i) mapeia para mensagem amigável esperada', async (code, status, expectedMessage) => {
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: vi.fn().mockResolvedValue(
        jsonResponse(status as number, {
          statusCode: status,
          code,
          message: 'detalhe interno qualquer, nunca deve aparecer na UI',
          requestId: 'req-x',
        }),
      ),
    }));

    const { startGpsSession } = await import('./gpsClient');

    await expect(startGpsSession({ linhaId: '5102' })).rejects.toMatchObject({
      code,
      statusCode: status,
      message: expectedMessage,
    });
  });

  it('codigo desconhecido ou corpo ausente cai no fallback generico seguro (nunca mensagem crua)', async () => {
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    }));

    const { startGpsSession, GPS_GENERIC_ERROR_MESSAGE } = await import('./gpsClient');

    await expect(startGpsSession({ linhaId: '5102' })).rejects.toMatchObject({
      message: GPS_GENERIC_ERROR_MESSAGE,
      code: null,
    });
  });

  it('sessao criada com sucesso mas unmatched retorna scheduleMatchStatus sem lancar erro', async () => {
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: vi.fn().mockResolvedValue(
        jsonResponse(201, {
          status: 'success',
          sessionId: 's-1',
          scheduleMatchStatus: 'unmatched',
        }),
      ),
    }));

    const { startGpsSession } = await import('./gpsClient');

    await expect(startGpsSession({ linhaId: 'FR60' })).resolves.toEqual({
      status: 'success',
      sessionId: 's-1',
      scheduleMatchStatus: 'unmatched',
    });
  });

  it('429 continua lancando RateLimitError (nao GpsApiError)', async () => {
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: vi
        .fn()
        .mockResolvedValue(jsonResponse(429, {}, { 'Retry-After': '5' })),
    }));

    const { startGpsSession, RateLimitError } = await import('./gpsClient');

    await expect(startGpsSession({ linhaId: '5102' })).rejects.toBeInstanceOf(RateLimitError);
  });

  it('sessao retomada (resumed=true) preserva os campos de contexto da sessao ativa', async () => {
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: vi.fn().mockResolvedValue(
        jsonResponse(201, {
          status: 'success',
          sessionId: 's-1',
          scheduleMatchStatus: 'matched',
          resumed: true,
          linhaId: '5102',
          iniciadoAt: '2026-07-28T12:00:00.000Z',
          snapshotsCount: 12,
          lastActivityAt: '2026-07-28T12:05:00.000Z',
          staleCandidate: false,
        }),
      ),
    }));

    const { startGpsSession } = await import('./gpsClient');

    await expect(startGpsSession({ linhaId: '5102' })).resolves.toMatchObject({
      sessionId: 's-1',
      resumed: true,
      snapshotsCount: 12,
    });
  });

  it('409 GPS_ACTIVE_SESSION_DIFFERENT_LINE lanca GpsActiveSessionConflictError com dados da sessao', async () => {
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: vi.fn().mockResolvedValue(
        jsonResponse(409, {
          statusCode: 409,
          status: 'active_session_conflict',
          code: 'GPS_ACTIVE_SESSION_DIFFERENT_LINE',
          message: 'Já existe uma sessão de rastreio ativa em outra linha.',
          requestId: 'req-conflict',
          session: {
            sessionId: 's-old',
            linhaId: '1',
            requestedLinhaId: '2',
            lastActivityAt: '2026-07-28T12:05:00.000Z',
            staleCandidate: true,
          },
        }),
      ),
    }));

    const { startGpsSession, GpsActiveSessionConflictError } = await import('./gpsClient');

    try {
      await startGpsSession({ linhaId: '2' });
      throw new Error('deveria ter lancado');
    } catch (err) {
      expect(err).toBeInstanceOf(GpsActiveSessionConflictError);
      const conflictErr = err as InstanceType<typeof GpsActiveSessionConflictError>;
      expect(conflictErr.session).toEqual({
        sessionId: 's-old',
        linhaId: '1',
        requestedLinhaId: '2',
        lastActivityAt: '2026-07-28T12:05:00.000Z',
        staleCandidate: true,
      });
      expect(conflictErr.requestId).toBe('req-conflict');
    }
  });

  it('GPS_IDEMPOTENCY_KEY_REUSED mapeia para mensagem propria, nao a generica', async () => {
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: vi.fn().mockResolvedValue(
        jsonResponse(409, {
          statusCode: 409,
          code: 'GPS_IDEMPOTENCY_KEY_REUSED',
          message: 'detalhe interno',
          requestId: 'req-idem',
        }),
      ),
    }));

    const { startGpsSession, GPS_GENERIC_ERROR_MESSAGE } = await import('./gpsClient');

    await expect(startGpsSession({ linhaId: '5102' })).rejects.toMatchObject({
      code: 'GPS_IDEMPOTENCY_KEY_REUSED',
      message: expect.not.stringContaining(GPS_GENERIC_ERROR_MESSAGE),
    });
  });

  it('getActiveGpsSession retorna sessao ativa ou null', async () => {
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: vi.fn().mockResolvedValue(jsonResponse(200, { session: null })),
    }));

    const { getActiveGpsSession } = await import('./gpsClient');

    await expect(getActiveGpsSession()).resolves.toEqual({ session: null });
  });

  it('abandonGpsSession chama o endpoint de abandono sem lancar em sucesso', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { status: 'success' }));
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: fetchMock,
    }));

    const { abandonGpsSession } = await import('./gpsClient');

    await expect(abandonGpsSession('s-1')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/gps/sessions/s-1/abandon'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('createGpsShare chama POST /gps/sessions/:id/share e retorna token/expiresAt', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(201, { token: 'tok-1', expiresAt: '2026-01-01T00:00:00Z' }));
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: fetchMock,
    }));

    const { createGpsShare } = await import('./gpsClient');

    await expect(createGpsShare('s-1')).resolves.toEqual({
      token: 'tok-1',
      expiresAt: '2026-01-01T00:00:00Z',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/gps/sessions/s-1/share'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('revokeGpsShare chama DELETE /gps/sessions/:id/share', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { status: 'success' }));
    vi.doMock('@/features/auth/api/fetchAuthenticatedApi', () => ({
      fetchAuthenticatedApi: fetchMock,
    }));

    const { revokeGpsShare } = await import('./gpsClient');

    await expect(revokeGpsShare('s-1')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/gps/sessions/s-1/share'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('getSharedTrip retorna o corpo quando a estrutura é válida (sem exigir JWT)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          status: 'active',
          linhaId: '5102',
          lastPosition: { lat: -19.87, lng: -43.96, updatedAt: '2026-01-01T00:00:00Z' },
        }),
      ),
    );

    const { getSharedTrip } = await import('./gpsClient');

    await expect(getSharedTrip('tok-abc')).resolves.toMatchObject({
      status: 'active',
      linhaId: '5102',
    });
  });

  it.each([
    'finished',
    'expired',
    'revoked',
    'not_found',
    'waiting_for_position',
    'stale',
  ])('getSharedTrip aceita o status %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { status })));
    const { getSharedTrip } = await import('./gpsClient');
    await expect(getSharedTrip('tok-abc')).resolves.toEqual({ status });
  });

  it('getSharedTrip nunca propaga corpo malformado — cai em not_found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { garbage: true })));
    const { getSharedTrip } = await import('./gpsClient');
    await expect(getSharedTrip('tok-abc')).resolves.toEqual({ status: 'not_found' });
  });

  it('getSharedTrip nunca lança em falha de rede — cai em not_found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const { getSharedTrip } = await import('./gpsClient');
    await expect(getSharedTrip('tok-abc')).resolves.toEqual({ status: 'not_found' });
  });
});
