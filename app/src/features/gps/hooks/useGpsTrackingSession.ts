import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  abandonGpsSession,
  finishGpsSession,
  GPS_GENERIC_ERROR_MESSAGE,
  GpsActiveSessionConflictError,
  type GpsActiveSessionConflictInfo,
  GpsApiError,
  type GpsBatchResult,
  type GpsPointPayload,
  type GpsStartSessionResult,
  getActiveGpsSession,
  RateLimitError,
  startGpsSession,
  submitGpsBatch,
} from '@/features/gps/api/gpsClient';
import { calcularDistanciaKm } from '@/lib/utils';
import { getTenantStorageKey } from '@/pwa/tenantNamespace';
import type { Linha } from '@/types/data.types';
import { GPS_AUTH_LOGOUT_EVENT } from '../gpsEvents';

export const TRACKING_TOGGLE_LABEL = 'Estou no ônibus agora';
const MOVING_INTERVAL_MS = 5_000;
const IDLE_INTERVAL_MS = 30_000;
const MAX_QUEUE_POINTS = 500;
const MAX_SESSION_DURATION_MS = 60 * 60 * 1000;
const MAX_ROUTE_DISTANCE_KM = 0.2;
const TERMINAL_DISTANCE_KM = 0.08;
const OFFLINE_SESSION_STORAGE_KEY = getTenantStorageKey('gps-offline-session');

// Retry config para erros de rate limit (429)
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 1_000;

// Loga apenas campos seguros (nunca o corpo bruto do backend/stack) — o
// backend é a única fonte de detalhe de erro sensível; a UI só repassa code/
// requestId, úteis para correlacionar com logs do servidor sem vazar texto livre.
function logGpsError(context: string, err: unknown): void {
  const safeDetail =
    err instanceof GpsApiError
      ? { code: err.code, statusCode: err.statusCode, requestId: err.requestId }
      : err instanceof RateLimitError
        ? { code: 'GPS_RATE_LIMITED' }
        : { name: err instanceof Error ? err.name : typeof err };
  // biome-ignore lint/suspicious/noConsole: log de diagnóstico GPS necessário em produção
  console.error(`[GPS] Falha ao ${context}`, safeDetail);
}

export type TrackingStopReason = 'manual' | 'parado' | 'saiu_rota' | 'terminal' | 'timeout';

interface PersistedTrackingSession {
  sessionId: string;
  linhaId: string;
  points: GpsPointPayload[];
  startedAt?: string;
}

interface SyncManagerCapableServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync: {
    register: (tag: string) => Promise<void>;
  };
}

export interface TrackingSnapshot {
  latitude: number;
  longitude: number;
  accuracy: number;
  speedKmh: number;
  heading: number | null;
  timestamp: number;
}

export interface GpsTrackingState {
  label: string;
  isActive: boolean;
  status: TrackingStatus;
  sessionId: string | null;
  queueSize: number;
  isSyncing: boolean;
  nextCollectionIntervalMs: number;
  lastStopReason: TrackingStopReason | null;
  distanceKm: number;
  durationMs: number;
  snapshotsCount: number;
  acceptedPoints?: number;
  rejectedPoints?: number;
  lockedLine: Linha | null;
  rateLimitMessage: string | null;
  startError: string | null;
  // Sessão ativa do dono em OUTRA linha (409 GPS_ACTIVE_SESSION_DIFFERENT_LINE)
  // — nunca retomada silenciosamente. UI decide via resolveConflict/dismissConflict.
  conflict: GpsActiveSessionConflictInfo | null;
  start: (lineOverride?: Linha) => Promise<void>;
  stop: (reason?: TrackingStopReason) => Promise<void>;
  ingestSnapshot: (snapshot: TrackingSnapshot) => Promise<void>;
  resolveConflict: (action: 'finish' | 'abandon') => Promise<void>;
  dismissConflict: () => void;
}

export type TrackingStatus =
  | 'idle'
  | 'requesting_permission'
  | 'starting'
  | 'active'
  | 'offline_buffering'
  | 'ending'
  | 'ended'
  | 'error';

interface UseGpsTrackingSessionOptions {
  enabled: boolean;
  selectedLine: Linha | null;
}

export function trimQueue<T>(items: T[], maxItems: number): T[] {
  if (items.length <= maxItems) {
    return items;
  }

  return items.slice(items.length - maxItems);
}

export function resolveCollectionIntervalMs(speedKmh: number): number {
  return speedKmh > 3 ? MOVING_INTERVAL_MS : IDLE_INTERVAL_MS;
}

export function shouldAutoFinish(params: {
  sessionStartedAt: number;
  now: number;
}): 'timeout' | null {
  if (params.now - params.sessionStartedAt >= MAX_SESSION_DURATION_MS) {
    return 'timeout';
  }

  return null;
}

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined';
}

function readPersistedSession(): PersistedTrackingSession | null {
  if (!isBrowserEnvironment()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(OFFLINE_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedTrackingSession;
    if (!parsed.sessionId || !parsed.linhaId || !Array.isArray(parsed.points)) {
      return null;
    }

    return {
      ...parsed,
      points: trimQueue(parsed.points, MAX_QUEUE_POINTS),
    };
  } catch {
    return null;
  }
}

function writePersistedSession(session: PersistedTrackingSession | null): void {
  if (!isBrowserEnvironment()) {
    return;
  }

  if (!session) {
    window.sessionStorage.removeItem(OFFLINE_SESSION_STORAGE_KEY);
    return;
  }

  // GPS coordinates stored in sessionStorage (not localStorage) — cleared on tab close, reducing exposure window.
  window.sessionStorage.setItem(
    OFFLINE_SESSION_STORAGE_KEY,
    JSON.stringify({
      ...session,
      points: trimQueue(session.points, MAX_QUEUE_POINTS),
    }),
  );
}

// Conversao aproximada km->graus para fast-path bounding box:
// 1 grau lat ~= 111 km; 1 grau lng varia com cos(lat), mas dentro de BH (~-19.9)
// 1 grau lng ~= 104 km. Usamos 100 km/grau como limite inferior conservador.
const BOUNDING_BOX_DEG = MAX_ROUTE_DISTANCE_KM / 100;

function isNearLineRoute(snapshot: TrackingSnapshot, selectedLine: Linha | null): boolean {
  const routeCoordinates = selectedLine?.coordenadasTrajeto ?? [];
  if (routeCoordinates.length === 0) {
    return true;
  }

  // Pre-filtro O(N) com bounding box rapido antes do haversine completo —
  // descarta candidatos obviamente distantes sem trig.
  for (const [lat, lng] of routeCoordinates) {
    if (
      Math.abs(snapshot.latitude - lat) <= BOUNDING_BOX_DEG &&
      Math.abs(snapshot.longitude - lng) <= BOUNDING_BOX_DEG &&
      calcularDistanciaKm(snapshot.latitude, snapshot.longitude, lat, lng) <= MAX_ROUTE_DISTANCE_KM
    ) {
      return true;
    }
  }

  return false;
}

function isValidSnapshot(snapshot: TrackingSnapshot): boolean {
  if (!Number.isFinite(snapshot.latitude) || !Number.isFinite(snapshot.longitude)) {
    return false;
  }
  if (!Number.isFinite(snapshot.accuracy) || snapshot.accuracy <= 0) {
    return false;
  }
  if (!Number.isFinite(snapshot.speedKmh) || snapshot.speedKmh < 0) {
    return false;
  }
  if (!Number.isFinite(snapshot.timestamp) || snapshot.timestamp <= 0) {
    return false;
  }
  // Relogio do device fora de [-30s, +30s] vs Date.now: rejeita antes de enfileirar.
  // Backend tambem checa, mas evitar round-trip 4xx melhora latencia.
  if (Math.abs(snapshot.timestamp - Date.now()) > 30_000) {
    return false;
  }
  return true;
}

function isTerminalPoint(snapshot: TrackingSnapshot, selectedLine: Linha | null): boolean {
  const routeCoordinates = selectedLine?.coordenadasTrajeto;
  if (!routeCoordinates || routeCoordinates.length === 0) {
    return false;
  }

  const [lastLat, lastLng] = routeCoordinates[routeCoordinates.length - 1];
  return (
    calcularDistanciaKm(snapshot.latitude, snapshot.longitude, lastLat, lastLng) <=
    TERMINAL_DISTANCE_KM
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function startSessionWithRetry(
  linhaId: string,
  idempotencyKey: string,
  retries = MAX_RETRIES,
): Promise<GpsStartSessionResult> {
  try {
    return await startGpsSession({ linhaId, idempotencyKey });
  } catch (err) {
    if (err instanceof RateLimitError && retries > 0) {
      const delay = err.retryAfterMs ?? BASE_RETRY_DELAY_MS * (MAX_RETRIES - retries + 1);
      await sleep(delay);
      return startSessionWithRetry(linhaId, idempotencyKey, retries - 1);
    }
    throw err;
  }
}

export function useGpsTrackingSession(options: UseGpsTrackingSessionOptions): GpsTrackingState {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nextCollectionIntervalMs, setNextCollectionIntervalMs] = useState(IDLE_INTERVAL_MS);
  const [lastStopReason, setLastStopReason] = useState<TrackingStopReason | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<GpsActiveSessionConflictInfo | null>(null);
  // Linha que o usuário tentava rastrear quando o conflito apareceu — usada
  // para retomar a tentativa original depois de encerrar/abandonar a sessão
  // antiga (resolveConflict), sem pedir pro usuário selecionar a linha de novo.
  const pendingStartLineRef = useRef<Linha | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [snapshotsCount, setSnapshotsCount] = useState(0);
  const [acceptedPoints, setAcceptedPoints] = useState(0);
  const [rejectedPoints, setRejectedPoints] = useState(0);
  const queueRef = useRef<GpsPointPayload[]>([]);
  const sessionStartedAtRef = useRef<number | null>(null);
  const lastSnapshotCoordRef = useRef<{
    lat: number;
    lng: number;
    timestamp: number;
  } | null>(null);
  // Linha capturada no início da sessão — não muda se sidebar mudar a seleção
  const lockedLineRef = useRef<Linha | null>(null);
  const lockedLineIdRef = useRef<string | null>(null);
  // Contagem de snapshots consecutivos fora do corredor — só encerra após 3 falhas seguidas
  const outsideRouteCountRef = useRef(0);
  // Guard: evita que cliques duplos no botão de parar disparem múltiplas chamadas concorrentes
  const isStoppingRef = useRef(false);
  // Refs para leitura de estado reativo em callbacks sem causar recriação por deps instáveis
  const statusRef = useRef(status);
  statusRef.current = status;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const selectedLineRef = useRef(options.selectedLine);
  selectedLineRef.current = options.selectedLine;

  const resetSession = useCallback(() => {
    setStatus('idle');
    setSessionId(null);
    setQueueSize(0);
    setIsSyncing(false);
    setNextCollectionIntervalMs(IDLE_INTERVAL_MS);
    setLastStopReason(null);
    setRateLimitMessage(null);
    setStartError(null);
    setConflict(null);
    setDistanceKm(0);
    setDurationMs(0);
    setSnapshotsCount(0);
    setAcceptedPoints(0);
    setRejectedPoints(0);
    queueRef.current = [];
    sessionStartedAtRef.current = null;
    lastSnapshotCoordRef.current = null;
    lockedLineRef.current = null;
    lockedLineIdRef.current = null;
    outsideRouteCountRef.current = 0;
    writePersistedSession(null);
  }, []);

  const flushQueue = useCallback(
    async (isBatchSubmission: boolean): Promise<boolean> => {
      // Usa a linha capturada no início da sessão — nunca a seleção atual da sidebar
      const line = lockedLineRef.current ?? selectedLineRef.current;
      const lineId = lockedLineIdRef.current ?? line?.idRota ?? null;
      if (!sessionIdRef.current || !lineId || queueRef.current.length === 0) {
        return true;
      }

      setIsSyncing(true);
      const batch = queueRef.current;
      try {
        queueRef.current = [];
        setQueueSize(0);

        const result: GpsBatchResult = await submitGpsBatch({
          sessionId: sessionIdRef.current,
          linhaId: lineId,
          isBatchSubmission,
          points: batch,
        });

        setAcceptedPoints((count) => count + result.acceptedPoints);
        setRejectedPoints((count) => count + result.rejectedPoints);

        writePersistedSession({
          sessionId: sessionIdRef.current,
          linhaId: lineId,
          points: [],
          startedAt: sessionStartedAtRef.current
            ? new Date(sessionStartedAtRef.current).toISOString()
            : undefined,
        });
        // Flush bem-sucedido: recupera status ativo se estava pausado por falha anterior
        if (statusRef.current === 'offline_buffering') {
          setStatus('active');
        }
        return true;
      } catch (err) {
        queueRef.current = trimQueue([...batch, ...queueRef.current], MAX_QUEUE_POINTS);
        setQueueSize(queueRef.current.length);
        setStatus('offline_buffering');
        if (err instanceof RateLimitError) {
          setRateLimitMessage(err.message);
        }
        writePersistedSession({
          sessionId: sessionIdRef.current,
          linhaId: lineId,
          points: queueRef.current,
          startedAt: sessionStartedAtRef.current
            ? new Date(sessionStartedAtRef.current).toISOString()
            : undefined,
        });
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    // Sem deps reativas — lê estado via refs para evitar recriação de função a cada render
    [],
  );

  const start = useCallback(
    async (lineOverride?: Linha) => {
      // lineOverride permite que o chamador passe a linha diretamente, contornando
      // o timing de re-render do React quando state e start() são chamados no mesmo ciclo
      const effectiveLine = lineOverride ?? options.selectedLine;
      if (!options.enabled || !effectiveLine) {
        // biome-ignore lint/suspicious/noConsole: log de diagnóstico GPS necessário em produção
        console.warn('[GPS] start() ignorado: tracking desabilitado ou linha não selecionada', {
          enabled: options.enabled,
          selectedLine: effectiveLine?.idRota ?? null,
        });
        return;
      }

      if (
        statusRef.current === 'requesting_permission' ||
        statusRef.current === 'starting' ||
        statusRef.current === 'ending'
      ) {
        return;
      }

      setStatus('requesting_permission');
      try {
        setLastStopReason(null);
        setConflict(null);
        setStatus('starting');
        const idempotencyKey = crypto.randomUUID();
        const response = await startSessionWithRetry(effectiveLine.idRota, idempotencyKey);

        lockedLineRef.current = effectiveLine;
        lockedLineIdRef.current = effectiveLine.idRota;
        // P0.2 — sessão retomada (resumed=true) traz contadores reais do
        // backend; nunca zera como se fosse sessão nova (perderia
        // duração/pontos já contribuídos antes do reload/crash).
        if (response.resumed) {
          sessionStartedAtRef.current = response.iniciadoAt
            ? new Date(response.iniciadoAt).getTime()
            : Date.now();
          setSnapshotsCount(response.snapshotsCount ?? 0);
          setAcceptedPoints(response.snapshotsCount ?? 0);
          setRejectedPoints(0);
          setDurationMs(
            response.iniciadoAt ? Date.now() - new Date(response.iniciadoAt).getTime() : 0,
          );
        } else {
          sessionStartedAtRef.current = Date.now();
        }
        setSessionId(response.sessionId);
        setStatus('active');
        writePersistedSession({
          sessionId: response.sessionId,
          linhaId: effectiveLine.idRota,
          points: [],
          startedAt: sessionStartedAtRef.current
            ? new Date(sessionStartedAtRef.current).toISOString()
            : undefined,
        });
      } catch (err) {
        logGpsError('iniciar sessão de rastreio colaborativo', err);
        if (err instanceof RateLimitError) {
          setRateLimitMessage(err.message);
        } else if (err instanceof GpsActiveSessionConflictError) {
          // Nunca retoma silenciosamente na linha errada — guarda a linha
          // pretendida para resolveConflict() poder retomar a tentativa.
          pendingStartLineRef.current = effectiveLine;
          setConflict(err.session);
        } else {
          // GpsApiError.message já vem mapeado com segurança a partir do `code`
          // público (ver GPS_ERROR_CODE_MESSAGES em gpsClient.ts) — nunca é o
          // texto livre bruto do backend. Erros inesperados usam o fallback
          // genérico, mas com requestId anexado quando disponível para suporte.
          const msg =
            err instanceof GpsApiError
              ? err.requestId && (!err.code || err.code === 'GPS_INTERNAL_ERROR')
                ? `${err.message} (cód. ${err.requestId.slice(0, 8)})`
                : err.message
              : GPS_GENERIC_ERROR_MESSAGE;
          setStartError(msg);
          window.setTimeout(() => setStartError(null), 5000);
        }
        setStatus(err instanceof GpsActiveSessionConflictError ? 'idle' : 'error');
        if (!(err instanceof GpsActiveSessionConflictError)) {
          window.setTimeout(() => {
            setStatus((current) => (current === 'error' ? 'idle' : current));
          }, 5000);
        }
      }
    },
    [options.enabled, options.selectedLine],
  );

  const dismissConflict = useCallback(() => {
    pendingStartLineRef.current = null;
    setConflict(null);
  }, []);

  const resolveConflict = useCallback(
    async (action: 'finish' | 'abandon') => {
      const activeConflict = conflict;
      const retryLine = pendingStartLineRef.current;
      if (!activeConflict) return;

      try {
        if (action === 'finish') {
          await finishGpsSession(activeConflict.sessionId, 'manual');
        } else {
          await abandonGpsSession(activeConflict.sessionId);
        }
        setConflict(null);
        pendingStartLineRef.current = null;
        if (retryLine) {
          await start(retryLine);
        }
      } catch (err) {
        logGpsError(`resolver conflito de sessão ativa (${action})`, err);
        // Mantém o conflito visível para o usuário tentar de novo — nunca
        // descarta silenciosamente um erro ao encerrar/abandonar a sessão antiga.
      }
    },
    [conflict, start],
  );

  const stop = useCallback(
    async (reason: TrackingStopReason = 'manual') => {
      if (isStoppingRef.current) return;
      isStoppingRef.current = true;
      try {
        setLastStopReason(reason);
        setStatus('ending');
        if (queueRef.current.length > 0) {
          const flushed = await flushQueue(true);
          if (!flushed) {
            setStatus('offline_buffering');
            setStartError('Não foi possível enviar os pontos pendentes. Tente novamente.');
            return;
          }
        }

        if (sessionIdRef.current) {
          try {
            await finishGpsSession(sessionIdRef.current, reason);
          } catch (err) {
            logGpsError('encerrar sessão de rastreio colaborativo', err);
            setStatus('offline_buffering');
            setStartError('Não foi possível encerrar o rastreio. Tente novamente.');
            return;
          }
        }

        setStatus('ended');
        // Deixa a transição `ended` ser observada pelo provider para preservar
        // as métricas do card de conclusão antes de limpar a sessão local.
        window.setTimeout(resetSession, 0);
      } finally {
        isStoppingRef.current = false;
      }
    },
    [flushQueue, resetSession],
  );

  const ingestSnapshot = useCallback(
    async (snapshot: TrackingSnapshot) => {
      if (statusRef.current !== 'active' || !sessionIdRef.current) {
        return;
      }

      if (!isValidSnapshot(snapshot)) {
        // Snapshot inutilizavel: descarta antes de enfileirar/network.
        return;
      }

      const previousSnapshot = lastSnapshotCoordRef.current;
      if (previousSnapshot) {
        const elapsedSeconds = (snapshot.timestamp - previousSnapshot.timestamp) / 1000;
        if (elapsedSeconds > 0) {
          const segmentKm = calcularDistanciaKm(
            previousSnapshot.lat,
            previousSnapshot.lng,
            snapshot.latitude,
            snapshot.longitude,
          );
          // Um salto fisicamente implausível não entra na fila nem contamina
          // distância/ETA. O servidor mantém a mesma barreira na validação.
          const impliedSpeedKmh = (segmentKm / elapsedSeconds) * 3600;
          if (impliedSpeedKmh > 180) {
            return;
          }
        }
      }

      const point: GpsPointPayload = {
        lat: snapshot.latitude,
        lng: snapshot.longitude,
        speed: snapshot.speedKmh,
        accuracy: snapshot.accuracy,
        heading: snapshot.heading ?? undefined,
        timestampDispositivo: new Date(snapshot.timestamp).toISOString(),
      };

      queueRef.current = trimQueue([...queueRef.current, point], MAX_QUEUE_POINTS);
      setQueueSize(queueRef.current.length);
      setNextCollectionIntervalMs(resolveCollectionIntervalMs(snapshot.speedKmh));
      setSnapshotsCount((c) => c + 1);

      const prev = lastSnapshotCoordRef.current;
      if (prev) {
        const seg = calcularDistanciaKm(prev.lat, prev.lng, snapshot.latitude, snapshot.longitude);
        setDistanceKm((d) => d + seg);
      }
      lastSnapshotCoordRef.current = {
        lat: snapshot.latitude,
        lng: snapshot.longitude,
        timestamp: snapshot.timestamp,
      };
      const persistLine = lockedLineRef.current ?? selectedLineRef.current;
      if (persistLine) {
        writePersistedSession({
          sessionId: sessionIdRef.current,
          linhaId: lockedLineIdRef.current ?? persistLine.idRota,
          points: queueRef.current,
          startedAt: sessionStartedAtRef.current
            ? new Date(sessionStartedAtRef.current).toISOString()
            : undefined,
        });
      }

      const trackedLine = lockedLineRef.current ?? selectedLineRef.current;

      if (!isNearLineRoute(snapshot, trackedLine)) {
        outsideRouteCountRef.current++;
        if (outsideRouteCountRef.current >= 3) {
          await stop('saiu_rota');
        }
        return;
      }
      outsideRouteCountRef.current = 0;

      if (isTerminalPoint(snapshot, trackedLine)) {
        await stop('terminal');
        return;
      }

      const autoFinishReason = shouldAutoFinish({
        sessionStartedAt: sessionStartedAtRef.current ?? snapshot.timestamp,
        now: snapshot.timestamp,
      });

      if (autoFinishReason) {
        await stop(autoFinishReason);
        return;
      }

      if (navigator.onLine && queueRef.current.length > 0) {
        await flushQueue(queueRef.current.length > 1);
      }
    },
    // Removido: options.selectedLine, sessionId, status — lidos via refs; stop e flushQueue são estáveis
    [flushQueue, stop],
  );

  useEffect(() => {
    // Só restaura sessão persistida se ainda não há sessão em memória —
    // evita reverter uma sessão já ativa quando `options.selectedLine` muda
    // de referência (ex.: refetch do React Query) sem o idRota mudar de fato.
    if (!options.enabled || sessionId !== null) {
      return;
    }

    const persistedSession = readPersistedSession();
    if (!persistedSession) {
      return;
    }

    if (options.selectedLine && persistedSession.linhaId !== options.selectedLine.idRota) {
      return;
    }

    queueRef.current = persistedSession.points;
    lockedLineIdRef.current = persistedSession.linhaId;
    if (options.selectedLine?.idRota === persistedSession.linhaId) {
      lockedLineRef.current = options.selectedLine;
    }
    sessionStartedAtRef.current = persistedSession.startedAt
      ? new Date(persistedSession.startedAt).getTime()
      : Date.now();
    setSessionId(persistedSession.sessionId);
    setQueueSize(persistedSession.points.length);
    setDurationMs(Date.now() - (sessionStartedAtRef.current ?? Date.now()));
    setStatus(persistedSession.points.length > 0 ? 'offline_buffering' : 'active');
  }, [options.enabled, sessionId, options.selectedLine]);

  // P0.2/Fase J — consulta a sessão ativa no backend ao abrir o fluxo (uma
  // única vez por habilitação), nunca só confiando no sessionStorage local:
  // sessão pode ter sido iniciada em outra aba/dispositivo, ou o storage local
  // pode estar vazio mas o backend ainda ter uma sessão aberta (crash antes de
  // persistir). Mesma linha selecionada → retoma direto; linha diferente →
  // vira conflito para o usuário decidir (nunca retoma silenciosamente).
  const hasCheckedActiveSessionRef = useRef(false);
  useEffect(() => {
    if (!options.enabled) {
      hasCheckedActiveSessionRef.current = false;
      return;
    }
    if (hasCheckedActiveSessionRef.current) {
      return;
    }
    hasCheckedActiveSessionRef.current = true;

    let cancelled = false;
    void getActiveGpsSession()
      .then(({ session }) => {
        if (cancelled || !session) return;

        const selected = selectedLineRef.current;
        if (sessionIdRef.current && session.sessionId !== sessionIdRef.current) {
          setConflict({
            sessionId: session.sessionId,
            linhaId: session.linhaId,
            requestedLinhaId: selected?.idRota ?? '',
            lastActivityAt: session.lastActivityAt,
            staleCandidate: session.staleCandidate,
          });
          return;
        }

        if (!selected || session.linhaId === selected.idRota) {
          lockedLineRef.current = selected;
          lockedLineIdRef.current = session.linhaId;
          sessionStartedAtRef.current = new Date(session.startedAt).getTime();
          setSnapshotsCount(session.snapshotsCount);
          setAcceptedPoints(session.snapshotsCount);
          setRejectedPoints(0);
          setDurationMs(Date.now() - new Date(session.startedAt).getTime());
          setSessionId(session.sessionId);
          setStatus('active');
        } else {
          setConflict({
            sessionId: session.sessionId,
            linhaId: session.linhaId,
            requestedLinhaId: selected?.idRota ?? '',
            lastActivityAt: session.lastActivityAt,
            staleCandidate: session.staleCandidate,
          });
        }
      })
      .catch((err) => logGpsError('consultar sessão ativa ao abrir o fluxo', err));

    return () => {
      cancelled = true;
    };
  }, [options.enabled]);

  useEffect(() => {
    if (
      lockedLineIdRef.current &&
      options.selectedLine?.idRota === lockedLineIdRef.current &&
      !lockedLineRef.current
    ) {
      lockedLineRef.current = options.selectedLine;
    }
  }, [options.selectedLine]);

  useEffect(() => {
    const handleAuthLogout = () => {
      // O evento é emitido antes de revogar a sessão de autenticação. Se a
      // rede permitir, finaliza no servidor com o token ainda disponível;
      // o efeito de enabled=false abaixo limpa qualquer estado local restante.
      if (sessionIdRef.current) {
        void stop('manual').finally(() => {
          writePersistedSession(null);
          resetSession();
        });
        return;
      }
      writePersistedSession(null);
      resetSession();
    };

    window.addEventListener(GPS_AUTH_LOGOUT_EVENT, handleAuthLogout);
    return () => window.removeEventListener(GPS_AUTH_LOGOUT_EVENT, handleAuthLogout);
  }, [resetSession, stop]);

  const previousEnabledRef = useRef(options.enabled);
  useEffect(() => {
    if (!options.enabled && previousEnabledRef.current) {
      // Logout/tenant rebind não pode deixar coordenadas ou sessionId do
      // usuário anterior para o próximo login. O evento de logout tenta
      // concluir a sessão antes; aqui fazemos a limpeza defensiva.
      writePersistedSession(null);
      if (!sessionIdRef.current) {
        resetSession();
      }
    }
    previousEnabledRef.current = options.enabled;
  }, [options.enabled, resetSession]);

  useEffect(() => {
    const handleOnline = () => {
      void flushQueue(true);

      if ('serviceWorker' in navigator) {
        void navigator.serviceWorker.ready
          .then((registration) => {
            if ('sync' in registration) {
              return (registration as SyncManagerCapableServiceWorkerRegistration).sync.register(
                'gps-flush-queue',
              );
            }
            return undefined;
          })
          .catch(() => undefined);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flushQueue]);

  useEffect(() => {
    const handleFlushRequest = () => {
      void flushQueue(true);
    };

    window.addEventListener('interno-rotas:gps-flush-queue', handleFlushRequest as EventListener);
    return () => {
      window.removeEventListener(
        'interno-rotas:gps-flush-queue',
        handleFlushRequest as EventListener,
      );
    };
  }, [flushQueue]);

  useEffect(() => {
    if (status !== 'active' && status !== 'offline_buffering') return;
    const id = window.setInterval(() => {
      if (sessionStartedAtRef.current) {
        setDurationMs(Date.now() - sessionStartedAtRef.current);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [status]);

  return useMemo(
    () => ({
      label: TRACKING_TOGGLE_LABEL,
      isActive:
        status === 'active' ||
        status === 'requesting_permission' ||
        status === 'starting' ||
        status === 'offline_buffering' ||
        status === 'ending',
      status,
      sessionId,
      queueSize,
      isSyncing,
      nextCollectionIntervalMs,
      lastStopReason,
      distanceKm,
      durationMs,
      snapshotsCount,
      acceptedPoints,
      rejectedPoints,
      lockedLine: lockedLineRef.current,
      rateLimitMessage,
      startError,
      conflict,
      start,
      stop,
      ingestSnapshot,
      resolveConflict,
      dismissConflict,
    }),
    [
      conflict,
      dismissConflict,
      distanceKm,
      durationMs,
      ingestSnapshot,
      isSyncing,
      lastStopReason,
      nextCollectionIntervalMs,
      queueSize,
      rateLimitMessage,
      rejectedPoints,
      resolveConflict,
      startError,
      sessionId,
      snapshotsCount,
      acceptedPoints,
      start,
      status,
      stop,
    ],
  );
}
