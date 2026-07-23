import { describe, expect, it } from 'vitest';
import { isCacheableApiRequest } from './apiCachePolicy';

function makeRequest(method: string, headers?: Record<string, string>): Request {
  return new Request('https://api.example.com/', { method, headers });
}

describe('isCacheableApiRequest', () => {
  it('permite endpoint público allowlisted sem Authorization', () => {
    const url = new URL('https://api.example.com/v1/gamification/rankings/public');
    expect(isCacheableApiRequest(url, makeRequest('GET'))).toBe(true);
  });

  it('rejeita endpoint fora da allowlist mesmo sem Authorization', () => {
    const url = new URL('https://api.example.com/v1/gamification/rankings/me');
    expect(isCacheableApiRequest(url, makeRequest('GET'))).toBe(false);
  });

  it('rejeita qualquer request com header Authorization, mesmo em path allowlisted', () => {
    const url = new URL('https://api.example.com/v1/gamification/rankings/public');
    const request = makeRequest('GET', { Authorization: 'Bearer token' });
    expect(isCacheableApiRequest(url, request)).toBe(false);
  });

  it('rejeita método não GET', () => {
    const url = new URL('https://api.example.com/v1/gamification/rankings/public');
    expect(isCacheableApiRequest(url, makeRequest('POST'))).toBe(false);
  });

  it('permite rotas de mobilidade/gtfs/transit públicas', () => {
    const paths = [
      '/v1/mobility/corridors/corridor-1/eta/point-2',
      '/v1/mobility/corridors/corridor-1/conditions',
      '/v1/planner/routes',
      '/v1/map/ufmg-predios',
      '/v1/api/gtfs/routes',
      '/v1/api/gtfs/routes/route-1',
      '/v1/api/gtfs/routes/route-1/stops',
      '/v1/api/gtfs/routes/route-1/shape',
      '/v1/api/gtfs/stops/search',
      '/v1/paradas',
      '/v1/stops/nearest',
      '/v1/partners/active',
      '/v1/transit/data',
      '/v1/transit/special-periods',
      '/v1/transit/bhtrans/live',
    ];

    for (const path of paths) {
      const url = new URL(`https://api.example.com${path}`);
      expect(isCacheableApiRequest(url, makeRequest('GET'))).toBe(true);
    }
  });

  it('rejeita rotas privadas conhecidas', () => {
    const paths = [
      '/v1/auth/me',
      '/v1/profile',
      '/v1/payments/status',
      '/v1/gps/active',
      '/v1/research/answers',
      '/v1/admin/anything',
      '/v1/notifications',
      '/v1/push/subscriptions',
      '/v1/gamification/summary/me',
    ];

    for (const path of paths) {
      const url = new URL(`https://api.example.com${path}`);
      expect(isCacheableApiRequest(url, makeRequest('GET'))).toBe(false);
    }
  });
});
