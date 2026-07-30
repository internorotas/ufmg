/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

describe('gpsClient — mapeamento de erros públicos do backend', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
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
});
