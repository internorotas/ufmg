import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  finishGpsSession,
  type GpsPointPayload,
  RateLimitError,
  startGpsSession,
  submitGpsBatch,
} from '@/features/gps/api/gpsClient';
import { calcularDistanciaKm } from '@/lib/utils';
import { getTenantStorageKey } from '@/pwa/tenantNamespace';
import type { Linha } from '@/types/data.types';

export const TRACKING_TOGGLE_LABEL = 'Estou no ônibus agora';
const MOVING_INTERVAL_MS = 5_000;
const IDLE_INTERVAL_MS = 30_000;
const MAX_QUEUE_POINTS = 500;
const IDLE_AUTO_FINISH_MS = 5 * 60 * 1000;
const MAX_SESSION_DURATION_MS = 60 * 60 * 1000;
const MAX_ROUTE_DISTANCE_KM = 0.2;
const TERMINAL_DISTANCE_KM = 0.08;
const OFFLINE_SESSION_STORAGE_KEY = getTenantStorageKey('gps-offline-session');

// Retry config para erros de rate limit (429)
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 1_000;

export type TrackingStopReason = 'manual' | 'parado' | 'saiu_rota' | 'terminal' | 'timeout';

interface PersistedTrackingSession {
  sessionId: string;
  linhaId: string;
  points: GpsPointPayload[];
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
  status: 'idle' | 'starting' | 'active' | 'paused' | 'error';
  sessionId: string | null;
  queueSize: number;
  isSyncing: boolean;
  nextCollectionIntervalMs: number;
  lastStopReason: TrackingStopReason | null;
  distanceKm: number;
  durationMs: number;
  snapshotsCount: number;
  lockedLine: Linha | null;
  rateLimitMessage: string | null;
  start: (lineOverride?: Linha) => Promise<void>;
  stop: (reason?: TrackingStopReason) => Promise<void>;
  ingestSnapshot: (snapshot: TrackingSnapshot) => Promise<void>;
}

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
  lastMovementAt: number | null;
  now: number;
}): 'parado' | 'timeout' | null {
  if (params.now - params.sessionStartedAt >= MAX_SESSION_DURATION_MS) {
    return 'timeout';
  }

  if (params.lastMovementAt !== null && params.now - params.lastMovementAt >= IDLE_AUTO_FINISH_MS) {
    return 'parado';
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
  retries = MAX_RETRIES,
): Promise<{ sessionId: string }> {
  try {
    return await startGpsSession({ linhaId });
  } catch (err) {
    if (err instanceof RateLimitError && retries > 0) {
      const delay = err.retryAfterMs ?? BASE_RETRY_DELAY_MS * (MAX_RETRIES - retries + 1);
      await sleep(delay);
      return startSessionWithRetry(linhaId, retries - 1);
    }
    throw err;
  }
}

export function useGpsTrackingSession(options: UseGpsTrackingSessionOptions): GpsTrackingState {
  const [status, setStatus] = useState<'idle' | 'starting' | 'active' | 'paused' | 'error'>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nextCollectionIntervalMs, setNextCollectionIntervalMs] = useState(IDLE_INTERVAL_MS);
  const [lastStopReason, setLastStopReason] = useState<TrackingStopReason | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [snapshotsCount, setSnapshotsCount] = useState(0);
  const queueRef = useRef<GpsPointPayload[]>([]);
  const sessionStartedAtRef = useRef<number | null>(null);
  const lastMovementAtRef = useRef<number | null>(null);
  const lastSnapshotCoordRef = useRef<{ lat: number; lng: number } | null>(null);
  // Linha capturada no início da sessão — não muda se sidebar mudar a seleção
  const lockedLineRef = useRef<Linha | null>(null);
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
    setDistanceKm(0);
    setDurationMs(0);
    setSnapshotsCount(0);
    queueRef.current = [];
    sessionStartedAtRef.current = null;
    lastMovementAtRef.current = null;
    lastSnapshotCoordRef.current = null;
    lockedLineRef.current = null;
    outsideRouteCountRef.current = 0;
    writePersistedSession(null);
  }, []);

  const flushQueue = useCallback(
    async (isBatchSubmission: boolean) => {
      // Usa a linha capturada no início da sessão — nunca a seleção atual da sidebar
      const line = lockedLineRef.current ?? selectedLineRef.current;
      if (!sessionIdRef.current || !line || queueRef.current.length === 0) {
        return;
      }

      setIsSyncing(true);
      const batch = queueRef.current;
      try {
        queueRef.current = [];
        setQueueSize(0);

        await submitGpsBatch({
          sessionId: sessionIdRef.current,
          linhaId: line.idRota,
          isBatchSubmission,
          points: batch,
        });

        writePersistedSession({
          sessionId: sessionIdRef.current,
          linhaId: line.idRota,
          points: [],
        });
        // Flush bem-sucedido: recupera status ativo se estava pausado por falha anterior
        if (statusRef.current === 'paused') {
          setStatus('active');
        }
      } catch (err) {
        queueRef.current = trimQueue([...batch, ...queueRef.current], MAX_QUEUE_POINTS);
        setQueueSize(queueRef.current.length);
        setStatus('paused');
        if (err instanceof RateLimitError) {
          setRateLimitMessage(err.message);
        }
        writePersistedSession({
          sessionId: sessionIdRef.current,
          linhaId: line.idRota,
          points: queueRef.current,
        });
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

      setStatus('starting');
      try {
        setLastStopReason(null);
        const response = await startSessionWithRetry(effectiveLine.idRota);

        lockedLineRef.current = effectiveLine;
        sessionStartedAtRef.current = Date.now();
        setSessionId(response.sessionId);
        setStatus('active');
        writePersistedSession({
          sessionId: response.sessionId,
          linhaId: effectiveLine.idRota,
          points: [],
        });
      } catch (err) {
        // biome-ignore lint/suspicious/noConsole: log de diagnóstico GPS necessário em produção
        console.error('[GPS] Falha ao iniciar sessão de rastreio colaborativo:', err);
        if (err instanceof RateLimitError) {
          setRateLimitMessage(err.message);
        }
        setStatus('error');
      }
    },
    [options.enabled, options.selectedLine],
  );

  const stop = useCallback(
    async (reason: TrackingStopReason = 'manual') => {
      if (isStoppingRef.current) return;
      isStoppingRef.current = true;
      try {
        setLastStopReason(reason);
        if (queueRef.current.length > 0) {
          await flushQueue(true);
        }

        if (sessionIdRef.current) {
          try {
            await finishGpsSession(sessionIdRef.current, reason);
          } catch (err) {
            // biome-ignore lint/suspicious/noConsole: log de diagnóstico GPS necessário em produção
            console.error('[GPS] Falha ao encerrar sessão de rastreio colaborativo:', err);
            // Não retorna — reseta a sessão mesmo em caso de erro para não bloquear o usuário
          }
        }

        resetSession();
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
      lastSnapshotCoordRef.current = { lat: snapshot.latitude, lng: snapshot.longitude };
      const persistLine = lockedLineRef.current ?? selectedLineRef.current;
      if (persistLine) {
        writePersistedSession({
          sessionId: sessionIdRef.current,
          linhaId: persistLine.idRota,
          points: queueRef.current,
        });
      }

      if (snapshot.speedKmh > 3) {
        lastMovementAtRef.current = snapshot.timestamp;
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
        lastMovementAt: lastMovementAtRef.current,
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
    if (sessionId !== null) {
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
    setSessionId(persistedSession.sessionId);
    setQueueSize(persistedSession.points.length);
    if (persistedSession.points.length > 0) {
      setStatus('paused');
    }
  }, [sessionId, options.selectedLine]);

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
    if (status !== 'active') return;
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
      isActive: status === 'active' || status === 'starting' || status === 'paused',
      status,
      sessionId,
      queueSize,
      isSyncing,
      nextCollectionIntervalMs,
      lastStopReason,
      distanceKm,
      durationMs,
      snapshotsCount,
      lockedLine: lockedLineRef.current,
      rateLimitMessage,
      start,
      stop,
      ingestSnapshot,
    }),
    [
      distanceKm,
      durationMs,
      ingestSnapshot,
      isSyncing,
      lastStopReason,
      nextCollectionIntervalMs,
      queueSize,
      rateLimitMessage,
      sessionId,
      snapshotsCount,
      start,
      status,
      stop,
    ],
  );
}
