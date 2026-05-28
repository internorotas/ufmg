import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthRequestError, refreshSession } from './authClient';

describe('authClient refreshSession', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna sessao anonima quando o backend responde sem token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          accessToken: null,
          expiresIn: null,
          tokenType: null,
          user: null,
        }),
      }),
    );

    await expect(refreshSession()).resolves.toEqual({
      accessToken: null,
      expiresIn: null,
      tokenType: null,
      user: null,
    });
  });

  it('mantem erro de auth para respostas nao ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    await expect(refreshSession()).rejects.toBeInstanceOf(AuthRequestError);
  });
});
