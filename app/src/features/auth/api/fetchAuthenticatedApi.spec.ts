import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authClientMock = vi.hoisted(() => ({
  refreshSession: vi.fn(),
}));

vi.mock('./authClient', () => ({
  refreshSession: authClientMock.refreshSession,
}));

import { useAuthStore } from '../store/authStore';
import type { RefreshResponse } from './authClient';
import { fetchAuthenticatedApi } from './fetchAuthenticatedApi';

describe('fetchAuthenticatedApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'token-antigo',
      user: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.getState().resetSession();
  });

  it('compartilha um unico refresh entre requests 401 concorrentes', async () => {
    let resolveRefresh!: (value: RefreshResponse) => void;
    authClientMock.refreshSession.mockReturnValue(
      new Promise<RefreshResponse>((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const authorization = new Headers(init?.headers).get('Authorization');
      return new Response(null, {
        status: authorization === 'Bearer token-novo' ? 200 : 401,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const firstRequest = fetchAuthenticatedApi('/primeiro');
    const secondRequest = fetchAuthenticatedApi('/segundo');

    await vi.waitFor(() => {
      expect(authClientMock.refreshSession).toHaveBeenCalledTimes(1);
    });

    resolveRefresh({
      accessToken: 'token-novo',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: null,
    });

    const responses = await Promise.all([firstRequest, secondRequest]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(authClientMock.refreshSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(useAuthStore.getState().accessToken).toBe('token-novo');
  });
});
