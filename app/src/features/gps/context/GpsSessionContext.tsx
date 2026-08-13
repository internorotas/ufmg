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
import { GpsActiveSessionConflictDialog } from '@/features/gps/components/GpsActiveSessionConflictDialog';
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
import { formatDurationHuman } from '@/lib/formatters';

// Tempo sem posição GPS (app em background) para o primeiro aviso, não-bloqueante —
// celular no bolso durante uma viagem normal é comportamento comum, não merece
// interromper a tela na volta. Só escala pra modal bloqueante se continuar parado.
const STALE_BACKGROUND_NUDGE_MS = 10 * 60 * 1000;
const STALE_BACKGROUND_BLOCK_MS = 20 * 60 * 1000;

interface CompletedSession {
  sessionId: string;
  distanceKm: number;
  durationMs: number;
  snapshotsCount: number;
  acceptedPoints: number;
  rejectedPoints: number;
  linhaNome: string;
  linhaCorHex: string;
  stopReason: string;
}

const STOP_REASON_LABELS: Record<string, string> = {
  terminal: 'Chegou ao terminal!',
  saiu_rota: 'Encerrado: você saiu do trajeto',
  parado: 'Rastreio encerrado',
  timeout: 'Encerrado: limite de 1 hora atingido',
  manual: 'Rastreio encerrado',
};

const GpsSessionContext = createContext<GpsTrackingState | null>(null);

function GpsSessionCompletedCard({
  session,
  onDismiss,
}: {
  session: CompletedSession;
  onDismiss: () => void;
}) {
  const reasonLabel = STOP_REASON_LABELS[session.stopReason] ?? 'Rastreio encerrado';
  const isAutoStop = session.stopReason !== 'manual';

  return (
    <div className="pointer-events-none fixed inset-0 z-(--z-sheet) flex items-end justify-start pb-24 pl-3 md:items-center md:justify-center md:pb-0 md:pl-0">
      <div className="pointer-events-auto w-56 rounded-lg border border-success-border bg-card p-4 shadow-lg md:max-w-xs md:w-full md:mx-4">
        {/* Cabeçalho */}
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background-secondary text-sm font-bold tabular-nums text-text-primary">
            <Bus size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-success-text">{reasonLabel}</p>
            <p className="truncate text-micro text-text-secondary" title={session.linhaNome}>
              {session.linhaNome}
            </p>
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
          <p className="mb-2 rounded-lg bg-background-secondary px-2.5 py-1.5 text-micro text-text-secondary">
            O rastreio foi encerrado automaticamente.
          </p>
        )}

        <div className="mb-3 h-px bg-card-border" />

        {/* Estatísticas */}
        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-background-secondary p-1.5">
            <Timer
              size={12}
              className="mx-auto mb-0.5 text-brand-primary dark:text-brand-accent"
              aria-hidden="true"
            />
            <p className="text-micro text-text-tertiary">Duração</p>
            <p className="text-micro font-bold text-text-primary">
              {formatDurationHuman(session.durationMs)}
            </p>
          </div>
          <div className="rounded-lg bg-background-secondary p-1.5">
            <MapPin
              size={12}
              className="mx-auto mb-0.5 text-brand-primary dark:text-brand-accent"
              aria-hidden="true"
            />
            <p className="text-micro text-text-tertiary">Distância</p>
            <p className="text-micro font-bold text-text-primary">
              {session.distanceKm.toFixed(2)} km
            </p>
          </div>
          <div className="rounded-lg bg-background-secondary p-1.5">
            <Trophy
              size={12}
              className="mx-auto mb-0.5 text-brand-primary dark:text-brand-accent"
              aria-hidden="true"
            />
            <p className="text-micro text-text-tertiary">Pontos aceitos</p>
            <p className="text-micro font-bold text-text-primary">{session.acceptedPoints}</p>
          </div>
        </div>

        {session.rejectedPoints > 0 && (
          <p className="mb-3 text-center text-micro text-warning-text">
            {session.rejectedPoints} ponto(s) rejeitado(s) pela validação.
          </p>
        )}

        <p className="flex items-center justify-center gap-1 text-micro text-text-secondary">
          <Heart size={9} className="text-danger-solid" fill="currentColor" aria-hidden="true" />
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

  const { isActive, ingestSnapshot, status, rateLimitMessage, startError, conflict } = rastreio;
  const linhaAtivaRef = useRef<typeof linhaSelecionada>(null);

  useEffect(() => {
    if (isActive && linhaSelecionada) {
      linhaAtivaRef.current = linhaSelecionada;
    }
    if (!isActive && status === 'idle') {
      linhaAtivaRef.current = null;
    }
  }, [isActive, linhaSelecionada, status]);

  // === Manter coleta viva ===
  useWakeLock(isActive);
  useAudioKeepAlive(isActive);

  // === Detecção de "esqueceu de encerrar" (declarado antes do ingest useEffect) ===
  const lastGpsUpdateRef = useRef<number | null>(null);
  const [staleTripLevel, setStaleTripLevel] = useState<'none' | 'nudge' | 'blocking'>('none');

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
    acceptedPoints: number;
    rejectedPoints: number;
  }>({ distanceKm: 0, durationMs: 0, snapshotsCount: 0, acceptedPoints: 0, rejectedPoints: 0 });
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
        acceptedPoints: rastreio.acceptedPoints ?? 0,
        rejectedPoints: rastreio.rejectedPoints ?? 0,
      };
      lastActiveSessionIdRef.current = rastreio.sessionId;
    }
  }, [
    isActive,
    rastreio.distanceKm,
    rastreio.durationMs,
    rastreio.snapshotsCount,
    rastreio.acceptedPoints,
    rastreio.rejectedPoints,
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
    const nowIdle = status === 'idle' || status === 'ended';
    const completionLine = linhaSelecionada ?? linhaAtivaRef.current;

    if (wasActive && nowIdle && completionLine) {
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
          label: completionLine.nome,
          params: {
            stop_reason: stopReason,
            distance_km: Math.round(stats.distanceKm * 100) / 100,
            duration_s: Math.round(stats.durationMs / 1000),
            snapshots: stats.snapshotsCount,
            linha_id: completionLine.idRota,
          },
        });

        void queryClient.invalidateQueries({ queryKey: VIAGENS_QUERY_KEY });

        const completed: CompletedSession = {
          sessionId: lastActiveSessionIdRef.current ?? '',
          ...stats,
          linhaNome: completionLine.sublinha
            ? `${completionLine.nome} · ${completionLine.sublinha}`
            : completionLine.nome,
          linhaCorHex: completionLine.corHex,
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
      setStaleTripLevel('none');
      return;
    }
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const last = lastGpsUpdateRef.current;
      if (last === null) return;
      const elapsed = Date.now() - last;
      if (elapsed > STALE_BACKGROUND_BLOCK_MS) {
        setStaleTripLevel('blocking');
      } else if (elapsed > STALE_BACKGROUND_NUDGE_MS) {
        setStaleTripLevel((prev) => (prev === 'blocking' ? prev : 'nudge'));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive]);

  // Linha capturada ao início da sessão — persiste enquanto ativa para que o
  // card não pisque se linhaSelecionada mudar (ex: usuário navega para outra rota).
  const linhaParaCard = linhaAtivaRef.current ?? linhaSelecionada;

  // Restaura ao expandido quando sessão termina
  useEffect(() => {
    if (!isActive) setIsCardMinimized(false);
  }, [isActive]);

  // === Toasts (earlyStop/startError/rateLimit) nunca empilham: mesma posição
  // fixa na tela, então só um é renderizado por vez, por ordem de prioridade. ===
  const activeToast = startError
    ? { kind: 'startError' as const, message: startError }
    : rateLimitMessage
      ? { kind: 'rateLimit' as const, message: rateLimitMessage }
      : earlyStopReason
        ? { kind: 'earlyStop' as const, message: earlyStopReason }
        : null;

  return (
    <GpsSessionContext.Provider value={rastreio}>
      {children}

      {/* Card de rastreio — persistente em qualquer rota.
          --z-sheet: acima do MenuLateral (--z-sidebar) e BottomNav (--z-bottom-nav). */}
      {isActive && linhaParaCard && (
        <div className="pointer-events-none fixed inset-0 z-(--z-sheet)">
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

      {/* Aviso não-bloqueante: primeira vez que a posição fica parada por muito tempo.
          Celular no bolso durante uma viagem normal é comum — não interrompe a tela,
          só oferece a opção de encerrar. Só vira modal bloqueante se persistir (abaixo). */}
      {staleTripLevel === 'nudge' && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-24 z-(--z-sheet) flex justify-center px-3 md:bottom-6"
        >
          <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-card-border bg-card p-3 shadow-lg">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning-bg">
              <Bus size={18} className="text-warning-text" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-primary">Ainda em viagem?</p>
              <p className="text-xs text-text-secondary">Sem posição há mais de 10 min.</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => setStaleTripLevel('none')}
                className="rounded-lg px-2.5 py-2 text-xs font-semibold text-text-secondary hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => {
                  setStaleTripLevel('none');
                  void rastreio.stop('manual');
                }}
                className="rounded-lg px-2.5 py-2 text-xs font-semibold text-warning-text hover:bg-warning-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal bloqueante: só depois de um segundo período parado (20min) sem resposta ao nudge. */}
      {staleTripLevel === 'blocking' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="still-on-trip-title"
          className="fixed inset-0 z-(--z-modal) flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
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
                  Não detectamos sua posição há mais de 20 minutos.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setStaleTripLevel('none')}
                className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                Ainda estou no ônibus
              </button>
              <button
                type="button"
                onClick={() => {
                  setStaleTripLevel('none');
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

      {/* Toast único para earlyStop/startError/rateLimit — nunca mais de um por vez (ver activeToast) */}
      {activeToast && (
        <div
          role="alert"
          aria-live={activeToast.kind === 'startError' ? 'assertive' : 'polite'}
          className="pointer-events-none fixed inset-0 z-(--z-sheet) flex items-end justify-start pb-24 pl-3 md:pb-8"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-warning-border bg-warning-bg px-3 py-2.5 text-sm text-warning-text shadow-lg">
            <span>{activeToast.message}</span>
            {activeToast.kind === 'earlyStop' && (
              <button
                type="button"
                onClick={() => setEarlyStopReason(null)}
                aria-label="Fechar aviso"
                className="flex size-5 shrink-0 items-center justify-center rounded text-warning-text/70 hover:text-warning-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warning-text"
              >
                ×
              </button>
            )}
            {activeToast.kind === 'rateLimit' && (
              <button
                type="button"
                onClick={() => rastreio.stop()}
                aria-label="Fechar aviso"
                className="flex size-5 shrink-0 items-center justify-center rounded text-warning-text/70 hover:text-warning-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warning-text"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conflito de sessão ativa em outra linha (409 GPS_ACTIVE_SESSION_DIFFERENT_LINE) —
          nunca retomada silenciosamente; usuário decide encerrar/abandonar/cancelar. */}
      {conflict && (
        <GpsActiveSessionConflictDialog
          conflict={conflict}
          onResolve={rastreio.resolveConflict}
          onDismiss={rastreio.dismissConflict}
        />
      )}
    </GpsSessionContext.Provider>
  );
}

export function useGpsSession(): GpsTrackingState {
  const ctx = useContext(GpsSessionContext);
  if (!ctx) throw new Error('useGpsSession must be inside GpsSessionProvider');
  return ctx;
}
