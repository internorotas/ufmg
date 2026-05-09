import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

interface AppQueryProviderProps {
  children: ReactNode;
}

export function AppQueryProvider({ children }: AppQueryProviderProps) {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    window.__internoAuthToken = accessToken ?? null;
  }, [accessToken]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
