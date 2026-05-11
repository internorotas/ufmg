import { describe, expect, it } from 'vitest';
import { resolveConsentStatus, type ConsentGateStatus } from './useConsentGate';

describe('resolveConsentStatus', () => {
  it('retorna denied para usuário não autenticado', async () => {
    const status = await resolveConsentStatus({
      isAuthenticated: false,
      cachedStatus: 'unknown',
      loadConsentState: async () => ({
        consentGps: true,
        consentResearch: true,
        consentGpsAt: '2026-05-11T00:00:00.000Z',
        consentResearchAt: '2026-05-11T00:00:00.000Z',
      }),
    });

    expect(status).toBe('denied');
  });

  it('retorna status em cache quando já conhecido', async () => {
    const status = await resolveConsentStatus({
      isAuthenticated: true,
      cachedStatus: 'accepted',
      loadConsentState: async () => {
        throw new Error('não deveria chamar API quando há cache');
      },
    });

    expect(status).toBe('accepted');
  });

  it('carrega consentimento remoto para estado unknown (aceite e recusa)', async () => {
    const accepted = await resolveConsentStatus({
      isAuthenticated: true,
      cachedStatus: 'unknown',
      loadConsentState: async () => ({
        consentGps: true,
        consentResearch: false,
        consentGpsAt: '2026-05-11T00:00:00.000Z',
        consentResearchAt: null,
      }),
    });
    expect(accepted satisfies ConsentGateStatus).toBe('accepted');

    const denied = await resolveConsentStatus({
      isAuthenticated: true,
      cachedStatus: 'unknown',
      loadConsentState: async () => ({
        consentGps: false,
        consentResearch: false,
        consentGpsAt: null,
        consentResearchAt: null,
      }),
    });
    expect(denied satisfies ConsentGateStatus).toBe('denied');
  });
});
