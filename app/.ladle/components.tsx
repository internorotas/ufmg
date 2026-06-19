import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { useAuthStore } from '@/features/auth/store/authStore';
import '../src/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
    mutations: { retry: false },
  },
});

export const Provider = ({ children }: { children: ReactNode }) => {
  if (useAuthStore.getState().authStatus === 'booting') {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'ladle-mock-token',
      user: {
        id: 1,
        displayName: 'Usuário Demo',
        avatarUrl: null,
        nickname: 'demo',
      },
    });
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <div className="fixed bottom-4 right-4 z-[9999]">
            <ThemeToggle />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
