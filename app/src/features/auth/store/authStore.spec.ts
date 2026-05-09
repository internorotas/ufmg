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
});
