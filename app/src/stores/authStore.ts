import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  nome: string;
  googleSub?: string;
  avatarUrl?: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasSeenOnboarding: false,

      setAccessToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),

      setUser: (user) => set({ user }),

      setLoading: (loading) => set({ isLoading: loading }),

      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),

      login: (token, user) =>
        set({
          accessToken: token,
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    },
  ),
);
