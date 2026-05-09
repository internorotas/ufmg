import { createContext, type ReactNode, useContext } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';

interface AuthContextValue {
  accessToken: string | null;
  authStatus: 'booting' | 'authenticated' | 'anonymous';
  isAuthenticated: boolean;
  user: {
    id: number;
    displayName: string;
    avatarUrl: string | null;
    nickname: string | null;
  } | null;
  setAuthenticatedSession: (payload: {
    accessToken: string;
    user: {
      id: number;
      displayName: string;
      avatarUrl: string | null;
      nickname: string | null;
    } | null;
  }) => void;
  setAnonymousSession: () => void;
  resetSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const authStatus = useAuthStore((state) => state.authStatus);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const setAuthenticatedSession = useAuthStore((state) => state.setAuthenticatedSession);
  const setAnonymousSession = useAuthStore((state) => state.setAnonymousSession);
  const resetSession = useAuthStore((state) => state.resetSession);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        authStatus,
        isAuthenticated,
        user,
        setAuthenticatedSession,
        setAnonymousSession,
        resetSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext precisa de <AuthProvider>');
  }

  return context;
}
