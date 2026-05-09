import { create } from 'zustand';

export type AuthStatus = 'booting' | 'authenticated' | 'anonymous';

export interface AuthUser {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  nickname: string | null;
}

interface AuthState {
  accessToken: string | null;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  user: AuthUser | null;
  setAuthenticatedSession: (payload: { accessToken: string; user: AuthUser | null }) => void;
  setAnonymousSession: () => void;
  resetSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  authStatus: 'booting',
  isAuthenticated: false,
  user: null,
  setAuthenticatedSession: ({ accessToken, user }) => {
    set({
      accessToken,
      user,
      authStatus: 'authenticated',
      isAuthenticated: true,
    });
  },
  setAnonymousSession: () => {
    set({
      accessToken: null,
      user: null,
      authStatus: 'anonymous',
      isAuthenticated: false,
    });
  },
  resetSession: () => {
    set({
      accessToken: null,
      user: null,
      authStatus: 'anonymous',
      isAuthenticated: false,
    });
  },
}));
