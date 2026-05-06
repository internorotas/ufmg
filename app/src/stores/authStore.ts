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

const ONBOARDING_STORAGE_KEY = 'onboarding_completed';

function readOnboardingFlagFromStorage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasSeenOnboarding: readOnboardingFlagFromStorage(),

      setAccessToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),

      setUser: (user) => set({ user }),

      setLoading: (loading) => set({ isLoading: loading }),

      setHasSeenOnboarding: (seen) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(ONBOARDING_STORAGE_KEY, String(seen));
        }

        set({ hasSeenOnboarding: seen });
      },

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
