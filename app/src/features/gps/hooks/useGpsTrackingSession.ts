import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  finishGpsSession,
  type GpsPointPayload,
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
const MAX_ROUTE_DISTANCE_KM = 0.3;
const TERMINAL_DISTANCE_KM = 0.08;
const OFFLINE_SESSION_STORAGE_KEY = getTenantStorageKey('gps-offline-session');

type TrackingStopReason = 'manual' | 'parado' | 'saiu_rota' | 'terminal' | 'timeout';

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
  start: () => Promise<void>;
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

  const raw = window.localStorage.getItem(OFFLINE_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedTrackingSession;
    if (
      !parsed.sessionId ||
      !parsed.linhaId ||
      !Array.isArray(parsed.points)
    ) {
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
    window.localStorage.removeItem(OFFLINE_SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    OFFLINE_SESSION_STORAGE_KEY,
    JSON.stringify({
      ...session,
      points: trimQueue(session.points, MAX_QUEUE_POINTS),
    }),
  );
}

function isNearLineRoute(snapshot: TrackingSnapshot, selectedLine: Linha | null): boolean {
  const routeCoordinates = selectedLine?.coordenadasTrajeto ?? [];
  if (routeCoordinates.length === 0) {
    return true;
  }

  return routeCoordinates.some(([lat, lng]) => {
    return (
      calcularDistanciaKm(snapshot.latitude, snapshot.longitude, lat, lng) <= MAX_ROUTE_DISTANCE_KM
    );
  });
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

export function useGpsTrackingSession(options: UseGpsTrackingSessionOptions): GpsTrackingState {
  const [status, setStatus] = useState<'idle' | 'starting' | 'active' | 'paused' | 'error'>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nextCollectionIntervalMs, setNextCollectionIntervalMs] = useState(IDLE_INTERVAL_MS);
  const [lastStopReason, setLastStopReason] = useState<TrackingStopReason | null>(null);
  const queueRef = useRef<GpsPointPayload[]>([]);
  const sessionStartedAtRef = useRef<number | null>(null);
  const lastMovementAtRef = useRef<number | null>(null);

  const resetSession = useCallback(() => {
    setStatus('idle');
    setSessionId(null);
    setQueueSize(0);
    setIsSyncing(false);
    setNextCollectionIntervalMs(IDLE_INTERVAL_MS);
    setLastStopReason(null);
    queueRef.current = [];
    sessionStartedAtRef.current = null;
    lastMovementAtRef.current = null;
    writePersistedSession(null);
  }, []);

  const flushQueue = useCallback(
    async (isBatchSubmission: boolean) => {
      if (
        !sessionId ||
        !options.selectedLine ||
        queueRef.current.length === 0
      ) {
        return;
      }

      setIsSyncing(true);
      const batch = queueRef.current;
      try {
        queueRef.current = [];
        setQueueSize(0);

        await submitGpsBatch({
          sessionId,
          linhaId: options.selectedLine.idRota,
          isBatchSubmission,
          points: batch,
        });

        writePersistedSession({
          sessionId,
          linhaId: options.selectedLine.idRota,
          points: [],
        });
      } catch {
        queueRef.current = trimQueue([...batch, ...queueRef.current], MAX_QUEUE_POINTS);
        setQueueSize(queueRef.current.length);
        setStatus('paused');
        writePersistedSession({
          sessionId,
          linhaId: options.selectedLine.idRota,
          points: queueRef.current,
        });
      } finally {
        setIsSyncing(false);
      }
    },
    [options.selectedLine, sessionId],
  );

  const start = useCallback(async () => {
    if (!options.enabled || !options.selectedLine) {
      return;
    }

    setStatus('starting');
    try {
      setLastStopReason(null);
      const response = await startGpsSession({
        linhaId: options.selectedLine.idRota,
      });

      sessionStartedAtRef.current = Date.now();
      setSessionId(response.sessionId);
      setStatus('active');
      writePersistedSession({
        sessionId: response.sessionId,
        linhaId: options.selectedLine.idRota,
        points: [],
      });
    } catch {
      setStatus('error');
    }
  }, [options.enabled, options.selectedLine]);

  const stop = useCallback(
    async (reason: TrackingStopReason = 'manual') => {
      setLastStopReason(reason);
      if (queueRef.current.length > 0) {
        await flushQueue(true);
      }

      if (sessionId) {
        try {
          await finishGpsSession(sessionId, reason);
        } catch {
          setStatus('error');
          return;
        }
      }

      resetSession();
    },
    [flushQueue, resetSession, sessionId],
  );

  const ingestSnapshot = useCallback(
    async (snapshot: TrackingSnapshot) => {
      if (status !== 'active' || !sessionId) {
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
      if (options.selectedLine) {
        writePersistedSession({
          sessionId,
          linhaId: options.selectedLine.idRota,
          points: queueRef.current,
        });
      }

      if (snapshot.speedKmh > 3) {
        lastMovementAtRef.current = snapshot.timestamp;
      }

      if (!isNearLineRoute(snapshot, options.selectedLine)) {
        await stop('saiu_rota');
        return;
      }

      if (isTerminalPoint(snapshot, options.selectedLine)) {
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
        setStatus('active');
      }
    },
    [flushQueue, options.selectedLine, sessionId, status, stop],
  );

  useEffect(() => {
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
  }, [options.selectedLine]);

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
      start,
      stop,
      ingestSnapshot,
    }),
    [
      ingestSnapshot,
      isSyncing,
      lastStopReason,
      nextCollectionIntervalMs,
      queueSize,
      sessionId,
      start,
      status,
      stop,
    ],
  );
}
