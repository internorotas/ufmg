import { createContext, type ReactNode, useContext, useEffect } from 'react';
import { useLocationContext } from '@/contexts/LocationContext';
import { useRotasSelection } from '@/contexts/RotasContext';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { GpsTrackingCard } from '@/features/gps/components/GpsTrackingCard';
import {
  type GpsTrackingState,
  useGpsTrackingSession,
} from '@/features/gps/hooks/useGpsTrackingSession';

const GpsSessionContext = createContext<GpsTrackingState | null>(null);

/**
 * Mantém a sessão GPS viva independente de qual rota está ativa.
 * Deve ficar acima do <Routes> para não ser desmontado em navegações.
 */
export function GpsSessionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const { linhaSelecionada } = useRotasSelection();
  const { ultimaLeitura, heading } = useLocationContext();

  const rastreio = useGpsTrackingSession({
    enabled: isAuthenticated,
    selectedLine: linhaSelecionada,
  });

  const { isActive, ingestSnapshot } = rastreio;

  useEffect(() => {
    if (!ultimaLeitura || !isActive) return;
    void ingestSnapshot({
      ...ultimaLeitura,
      heading: ultimaLeitura.heading ?? heading,
    });
  }, [heading, ingestSnapshot, isActive, ultimaLeitura]);

  return (
    <GpsSessionContext.Provider value={rastreio}>
      {children}
      {/* Renderizado fora do <Routes> para persistir em qualquer rota */}
      {isActive && linhaSelecionada && (
        <div className="pointer-events-none fixed inset-0 z-900">
          <GpsTrackingCard rastreio={rastreio} linha={linhaSelecionada} />
        </div>
      )}
    </GpsSessionContext.Provider>
  );
}

export function useGpsSession(): GpsTrackingState {
  const ctx = useContext(GpsSessionContext);
  if (!ctx) throw new Error('useGpsSession must be inside GpsSessionProvider');
  return ctx;
}
