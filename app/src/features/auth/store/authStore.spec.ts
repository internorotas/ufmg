import { describe, expect, it } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  it('inicia sem token persistido e com status booting', () => {
    const state = useAuthStore.getState();

    expect(state.accessToken).toBeNull();
    expect(state.authStatus).toBe('booting');
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('reseta para anonymous sem depender de localStorage', () => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'token-a',
      user: {
        id: 7,
        displayName: 'Igor',
        avatarUrl: null,
        nickname: 'igor',
      },
    });

    useAuthStore.getState().resetSession();

    const state = useAuthStore.getState();
    expect(state.authStatus).toBe('anonymous');
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('updateUser altera perfil apenas quando autenticado', () => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'token-b',
      user: {
        id: 9,
        displayName: 'User 9',
        avatarUrl: null,
        nickname: null,
      },
    });

    useAuthStore.getState().updateUser({
      id: 9,
      displayName: 'User 9 Updated',
      avatarUrl: 'https://example.com/avatar.png',
      nickname: 'u9',
    });

    let state = useAuthStore.getState();
    expect(state.user).toEqual({
      id: 9,
      displayName: 'User 9 Updated',
      avatarUrl: 'https://example.com/avatar.png',
      nickname: 'u9',
    });

    useAuthStore.getState().setAnonymousSession();
    useAuthStore.getState().updateUser({
      id: 99,
      displayName: 'Should Not Persist',
      avatarUrl: null,
      nickname: null,
    });

    state = useAuthStore.getState();
    expect(state.user).toBeNull();
  });
});
