import { Bus, Heart, MapPin, Timer, Trophy } from 'lucide-react';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocationContext } from '@/contexts/LocationContext';
import { useRotasSelection } from '@/contexts/RotasContext';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { GpsTrackingCard } from '@/features/gps/components/GpsTrackingCard';
import {
  type GpsTrackingState,
  useGpsTrackingSession,
} from '@/features/gps/hooks/useGpsTrackingSession';
import { useAudioKeepAlive } from '@/hooks/useAudioKeepAlive';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useAnalytics } from '@/hooks/useAnalytics';

interface CompletedSession {
  distanceKm: number;
  durationMs: number;
  snapshotsCount: number;
  linhaNome: string;
  linhaCorHex: string;
}

const GpsSessionContext = createContext<GpsTrackingState | null>(null);

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

function GpsSessionCompletedCard({
  session,
  onDismiss,
}: {
  session: CompletedSession;
  onDismiss: () => void;
}) {
  const pontosEstimados = Math.max(1, Math.floor(session.snapshotsCount / 2));

  return (
    <div className="pointer-events-none fixed inset-0 z-1050 flex items-end justify-start pb-24 pl-3 md:items-center md:justify-center md:pb-0 md:pl-0">
      <div className="pointer-events-auto w-56 rounded-2xl border border-success-border bg-card p-4 shadow-xl md:max-w-xs md:w-full md:mx-4">
        {/* Cabeçalho */}
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums"
            style={{ backgroundColor: `${session.linhaCorHex}22`, color: session.linhaCorHex }}
          >
            <Bus size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-success-text">Rastreio concluído</p>
            <p className="truncate text-[10px] text-text-secondary">{session.linhaNome}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fechar"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-tertiary hover:bg-card-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
          >
            ×
          </button>
        </div>

        <div className="mb-3 h-px bg-card-border" />

        {/* Estatísticas */}
        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-background-secondary p-1.5">
            <Timer size={12} className="mx-auto mb-0.5 text-brand-primary" aria-hidden="true" />
            <p className="text-[9px] text-text-tertiary">Duração</p>
            <p className="text-[10px] font-bold text-text-primary">
              {formatDuration(session.durationMs)}
            </p>
          </div>
          <div className="rounded-lg bg-background-secondary p-1.5">
            <MapPin size={12} className="mx-auto mb-0.5 text-brand-primary" aria-hidden="true" />
            <p className="text-[9px] text-text-tertiary">Distância</p>
            <p className="text-[10px] font-bold text-text-primary">
              {session.distanceKm.toFixed(2)} km
            </p>
          </div>
          <div className="rounded-lg bg-background-secondary p-1.5">
            <Trophy size={12} className="mx-auto mb-0.5 text-brand-primary" aria-hidden="true" />
            <p className="text-[9px] text-text-tertiary">Pontos</p>
            <p className="text-[10px] font-bold text-text-primary">~{pontosEstimados}</p>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1 text-[10px] text-text-secondary">
          <Heart size={9} className="text-red-500" fill="currentColor" aria-hidden="true" />
          Obrigado por ajudar a comunidade!
        </p>
      </div>
    </div>
  );
}

/**
 * Mantém a sessão GPS viva independente de qual rota está ativa.
 * Deve ficar acima do <Routes> para não ser desmontado em navegações.
 *
 * Estratégias de persistência em background:
 *   - Screen Wake Lock API: impede que a tela apague automaticamente
 *   - Silent AudioContext: reduz throttle de JS em iOS quando app vai ao fundo
 *   - Re-adquire wake lock automaticamente quando usuário volta à aba
 */
export function GpsSessionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const { linhaSelecionada } = useRotasSelection();
  const { ultimaLeitura, heading } = useLocationContext();
  const { trackEvent } = useAnalytics();

  const rastreio = useGpsTrackingSession({
    enabled: isAuthenticated,
    selectedLine: linhaSelecionada,
  });

  const { isActive, ingestSnapshot, status } = rastreio;

  // === Manter coleta viva ===
  useWakeLock(isActive);
  useAudioKeepAlive(isActive);

  // === Ingestão de snapshots ===
  useEffect(() => {
    if (!ultimaLeitura || !isActive) return;
    void ingestSnapshot({
      ...ultimaLeitura,
      heading: ultimaLeitura.heading ?? heading,
    });
  }, [heading, ingestSnapshot, isActive, ultimaLeitura]);

  // === Completion feedback ===
  const lastActiveStatsRef = useRef<{
    distanceKm: number;
    durationMs: number;
    snapshotsCount: number;
  }>({ distanceKm: 0, durationMs: 0, snapshotsCount: 0 });

  // Captura o motivo de parada antes do resetSession() zerá-lo
  const capturedStopReasonRef = useRef<string | null>(null);
  useEffect(() => {
    if (rastreio.lastStopReason !== null) {
      capturedStopReasonRef.current = rastreio.lastStopReason;
    }
  }, [rastreio.lastStopReason]);

  const [completedSession, setCompletedSession] = useState<CompletedSession | null>(null);
  const prevIsActiveRef = useRef(false);
  const prevStatusRef = useRef<string>('idle');

  // Salva stats enquanto ativo para poder exibir ao encerrar
  useEffect(() => {
    if (isActive) {
      lastActiveStatsRef.current = {
        distanceKm: rastreio.distanceKm,
        durationMs: rastreio.durationMs,
        snapshotsCount: rastreio.snapshotsCount,
      };
    }
  }, [isActive, rastreio.distanceKm, rastreio.durationMs, rastreio.snapshotsCount]);

  // === Tracking: sessão iniciada ===
  useEffect(() => {
    if (prevStatusRef.current !== 'active' && status === 'active' && linhaSelecionada) {
      trackEvent({
        event: 'gps_session_started',
        category: 'engagement',
        action: 'gps_session_started',
        label: linhaSelecionada.nome,
        params: { linha_id: linhaSelecionada.idRota, linha_numero: linhaSelecionada.linha },
      });
    }
    prevStatusRef.current = status;
  }, [status, linhaSelecionada, trackEvent]);

  // Detecta fim de sessão
  useEffect(() => {
    const wasActive = prevIsActiveRef.current;
    const nowIdle = status === 'idle';

    if (wasActive && nowIdle && lastActiveStatsRef.current.durationMs > 5000 && linhaSelecionada) {
      const stats = lastActiveStatsRef.current;
      const stopReason = capturedStopReasonRef.current ?? 'manual';

      // === Tracking: sessão encerrada com stats ===
      trackEvent({
        event: 'gps_session_completed',
        category: 'engagement',
        action: 'gps_session_completed',
        label: linhaSelecionada.nome,
        params: {
          stop_reason: stopReason,
          distance_km: Math.round(stats.distanceKm * 100) / 100,
          duration_s: Math.round(stats.durationMs / 1000),
          snapshots: stats.snapshotsCount,
          linha_id: linhaSelecionada.idRota,
        },
      });
      capturedStopReasonRef.current = null;

      setCompletedSession({
        ...stats,
        linhaNome: linhaSelecionada.sublinha
          ? `${linhaSelecionada.nome} — ${linhaSelecionada.sublinha}`
          : linhaSelecionada.nome,
        linhaCorHex: linhaSelecionada.corHex,
      });

      const timeoutId = window.setTimeout(() => setCompletedSession(null), 8000);
      return () => window.clearTimeout(timeoutId);
    }

    prevIsActiveRef.current = isActive;
  }, [isActive, status, linhaSelecionada, trackEvent]);

  const dismissCompleted = useCallback(() => {
    setCompletedSession(null);
    trackEvent({ event: 'gps_completion_card_dismissed', category: 'engagement', action: 'gps_completion_card_dismissed' });
  }, [trackEvent]);

  return (
    <GpsSessionContext.Provider value={rastreio}>
      {children}

      {/* Card de rastreio — persistente em qualquer rota */}
      {isActive && linhaSelecionada && (
        <div className="pointer-events-none fixed inset-0 z-900">
          <GpsTrackingCard
            rastreio={rastreio}
            linha={linhaSelecionada}
            speedKmh={ultimaLeitura?.speedKmh}
            accuracyM={ultimaLeitura?.accuracy}
          />
        </div>
      )}

      {/* Card de conclusão */}
      {completedSession && (
        <GpsSessionCompletedCard session={completedSession} onDismiss={dismissCompleted} />
      )}
    </GpsSessionContext.Provider>
  );
}

export function useGpsSession(): GpsTrackingState {
  const ctx = useContext(GpsSessionContext);
  if (!ctx) throw new Error('useGpsSession must be inside GpsSessionProvider');
  return ctx;
}

