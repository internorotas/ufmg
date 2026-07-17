import { useQueryClient } from '@tanstack/react-query';
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
import { TripRatingCard } from '@/features/gps/components/TripRatingCard';
import {
  type GpsTrackingState,
  useGpsTrackingSession,
} from '@/features/gps/hooks/useGpsTrackingSession';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAudioKeepAlive } from '@/hooks/useAudioKeepAlive';
import { VIAGENS_QUERY_KEY } from '@/hooks/useHistoricoViagens';
import { useWakeLock } from '@/hooks/useWakeLock';

// Tempo sem posição GPS (app em background) para perguntar ao usuário se ainda está viajando
const STALE_BACKGROUND_THRESHOLD_MS = 10 * 60 * 1000;

interface CompletedSession {
  sessionId: string;
  distanceKm: number;
  durationMs: number;
  snapshotsCount: number;
  linhaNome: string;
  linhaCorHex: string;
  stopReason: string;
}

const STOP_REASON_LABELS: Record<string, string> = {
  terminal: 'Chegou ao terminal!',
  saiu_rota: 'Encerrado: você saiu do trajeto',
  parado: 'Encerrado: sem movimento por 5 min',
  timeout: 'Encerrado: limite de 1 hora atingido',
  manual: 'Rastreio encerrado',
};

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
  const reasonLabel = STOP_REASON_LABELS[session.stopReason] ?? 'Rastreio encerrado';
  const isAutoStop = session.stopReason !== 'manual';

  return (
    <div className="pointer-events-none fixed inset-0 z-1050 flex items-end justify-start pb-24 pl-3 md:items-center md:justify-center md:pb-0 md:pl-0">
      <div className="pointer-events-auto w-56 rounded-lg border border-success-border bg-card p-4 shadow-lg md:max-w-xs md:w-full md:mx-4">
        {/* Cabeçalho */}
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums"
            style={{ backgroundColor: `${session.linhaCorHex}22`, color: session.linhaCorHex }}
          >
            <Bus size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-success-text">{reasonLabel}</p>
            <p className="truncate text-[10px] text-text-secondary">{session.linhaNome}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fechar"
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-text-tertiary hover:bg-card-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
          >
            ×
          </button>
        </div>

        {isAutoStop && (
          <p className="mb-2 rounded-lg bg-background-secondary px-2.5 py-1.5 text-[10px] text-text-secondary">
            O rastreio foi encerrado automaticamente.
          </p>
        )}

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
  const queryClient = useQueryClient();

  const rastreio = useGpsTrackingSession({
    enabled: isAuthenticated,
    selectedLine: linhaSelecionada,
  });

  const { isActive, ingestSnapshot, status, rateLimitMessage } = rastreio;

  // === Manter coleta viva ===
  useWakeLock(isActive);
  useAudioKeepAlive(isActive);

  // === Detecção de "esqueceu de encerrar" (declarado antes do ingest useEffect) ===
  const lastGpsUpdateRef = useRef<number | null>(null);
  const [showStillOnTripPrompt, setShowStillOnTripPrompt] = useState(false);

  // === Ingestão de snapshots ===
  useEffect(() => {
    if (!ultimaLeitura || !isActive) return;
    lastGpsUpdateRef.current = Date.now();
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
  const lastActiveSessionIdRef = useRef<string | null>(null);

  // Captura o motivo de parada antes do resetSession() zerá-lo
  const capturedStopReasonRef = useRef<string | null>(null);
  useEffect(() => {
    if (rastreio.lastStopReason !== null) {
      capturedStopReasonRef.current = rastreio.lastStopReason;
    }
  }, [rastreio.lastStopReason]);

  const [completedSession, setCompletedSession] = useState<CompletedSession | null>(null);
  const [ratedSession, setRatedSession] = useState<CompletedSession | null>(null);
  const [earlyStopReason, setEarlyStopReason] = useState<string | null>(null);
  const lastCompletedRef = useRef<CompletedSession | null>(null);
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
      lastActiveSessionIdRef.current = rastreio.sessionId;
    }
  }, [
    isActive,
    rastreio.distanceKm,
    rastreio.durationMs,
    rastreio.snapshotsCount,
    rastreio.sessionId,
  ]);

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

    if (wasActive && nowIdle && linhaSelecionada) {
      const stats = lastActiveStatsRef.current;
      const stopReason = capturedStopReasonRef.current ?? 'manual';
      capturedStopReasonRef.current = null;
      prevIsActiveRef.current = isActive;

      // Sessão encerrada automaticamente antes de 5s: toast breve em vez do card completo
      if (stats.durationMs <= 5000 && stopReason !== 'manual') {
        const msg = STOP_REASON_LABELS[stopReason] ?? 'Rastreio encerrado automaticamente';
        setEarlyStopReason(msg);
        const timeoutId = window.setTimeout(() => setEarlyStopReason(null), 5000);
        return () => window.clearTimeout(timeoutId);
      }

      if (stats.durationMs > 5000) {
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

        void queryClient.invalidateQueries({ queryKey: VIAGENS_QUERY_KEY });

        const completed: CompletedSession = {
          sessionId: lastActiveSessionIdRef.current ?? '',
          ...stats,
          linhaNome: linhaSelecionada.sublinha
            ? `${linhaSelecionada.nome} — ${linhaSelecionada.sublinha}`
            : linhaSelecionada.nome,
          linhaCorHex: linhaSelecionada.corHex,
          stopReason,
        };
        lastCompletedRef.current = completed;
        setCompletedSession(completed);

        const timeoutId = window.setTimeout(() => {
          setCompletedSession(null);
          setRatedSession(lastCompletedRef.current);
        }, 8000);
        return () => window.clearTimeout(timeoutId);
      }

      return;
    }

    prevIsActiveRef.current = isActive;
  }, [isActive, status, linhaSelecionada, trackEvent, queryClient]);

  const dismissCompleted = useCallback(() => {
    setCompletedSession(null);
    setRatedSession(lastCompletedRef.current);
    lastCompletedRef.current = null;
    trackEvent({
      event: 'gps_completion_card_dismissed',
      category: 'engagement',
      action: 'gps_completion_card_dismissed',
    });
  }, [trackEvent]);

  const dismissRating = useCallback(() => setRatedSession(null), []);

  const [isCardMinimized, setIsCardMinimized] = useState(false);
  const handleToggleMinimize = useCallback(() => setIsCardMinimized((v) => !v), []);

  useEffect(() => {
    if (!isActive) {
      setShowStillOnTripPrompt(false);
      return;
    }
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const last = lastGpsUpdateRef.current;
      if (last === null) return;
      if (Date.now() - last > STALE_BACKGROUND_THRESHOLD_MS) {
        setShowStillOnTripPrompt(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive]);

  // Linha capturada ao início da sessão — persiste enquanto ativa para que o
  // card não pisque se linhaSelecionada mudar (ex: usuário navega para outra rota).
  const linhaAtivaRef = useRef<typeof linhaSelecionada>(null);
  useEffect(() => {
    if (isActive && linhaSelecionada) {
      linhaAtivaRef.current = linhaSelecionada;
    }
    if (!isActive) {
      linhaAtivaRef.current = null;
    }
  }, [isActive, linhaSelecionada]);
  const linhaParaCard = linhaAtivaRef.current ?? linhaSelecionada;

  // Restaura ao expandido quando sessão termina
  useEffect(() => {
    if (!isActive) setIsCardMinimized(false);
  }, [isActive]);

  return (
    <GpsSessionContext.Provider value={rastreio}>
      {children}

      {/* Card de rastreio — persistente em qualquer rota.
          z-1050: acima do MenuLateral (z-1003) e BottomNav (z-1010). */}
      {isActive && linhaParaCard && (
        <div className="pointer-events-none fixed inset-0 z-1050">
          <GpsTrackingCard
            rastreio={rastreio}
            linha={linhaParaCard}
            speedKmh={ultimaLeitura?.speedKmh}
            accuracyM={ultimaLeitura?.accuracy}
            isMinimized={isCardMinimized}
            onToggleMinimize={handleToggleMinimize}
          />
        </div>
      )}

      {/* Card de conclusão */}
      {completedSession && (
        <GpsSessionCompletedCard session={completedSession} onDismiss={dismissCompleted} />
      )}

      {/* Card de avaliação pós-viagem */}
      {ratedSession && !completedSession && (
        <TripRatingCard
          sessionId={ratedSession.sessionId}
          linhaNome={ratedSession.linhaNome}
          linhaCorHex={ratedSession.linhaCorHex}
          onRated={dismissRating}
          onDismiss={dismissRating}
        />
      )}

      {/* Toast para sessões encerradas automaticamente antes de 5s */}
      {earlyStopReason && (
        <div
          role="alert"
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-1050 flex items-end justify-start pb-24 pl-3 md:pb-8"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-warning-border bg-warning-bg px-3 py-2.5 text-sm text-warning-text shadow-lg">
            <span>{earlyStopReason}</span>
            <button
              type="button"
              onClick={() => setEarlyStopReason(null)}
              aria-label="Fechar aviso"
              className="flex size-5 shrink-0 items-center justify-center rounded text-warning-text/70 hover:text-warning-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warning-text"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Dialog: usuário voltou ao app com sessão ativa há muito tempo */}
      {showStillOnTripPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="still-on-trip-title"
          className="fixed inset-0 z-2000 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
        >
          <div className="w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-2xl sm:rounded-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-bg">
                <Bus size={20} className="text-warning-text" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p id="still-on-trip-title" className="font-semibold text-text-primary">
                  Ainda em viagem?
                </p>
                <p className="text-xs text-text-secondary">
                  Não detectamos sua posição há mais de 10 minutos.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowStillOnTripPrompt(false)}
                className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                Ainda estou no ônibus
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowStillOnTripPrompt(false);
                  void rastreio.stop('manual');
                }}
                className="w-full rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                Encerrar viagem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast para rate limit (429) */}
      {rateLimitMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-1050 flex items-end justify-start pb-24 pl-3 md:pb-8"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-warning-border bg-warning-bg px-3 py-2.5 text-sm text-warning-text shadow-lg">
            <span>{rateLimitMessage}</span>
            <button
              type="button"
              onClick={() => rastreio.stop()}
              aria-label="Fechar aviso"
              className="flex size-5 shrink-0 items-center justify-center rounded text-warning-text/70 hover:text-warning-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warning-text"
            >
              ×
            </button>
          </div>
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
