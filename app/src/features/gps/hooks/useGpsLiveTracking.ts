import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getApiStatus } from '@/hooks/useApiAvailability';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';
import { tenantSlug } from '@/tenants/tenantConfig';

export interface LiveLocationPayload {
  lat: number;
  lng: number;
  heading: number | null;
  confidence: number;
  updatedAt: string;
}

export interface GpsLiveState {
  position: LiveLocationPayload | null;
  /** true se updatedAt > 10 min — posição não está mais sendo atualizada */
  isStale: boolean;
  /** true se polling falhou consecutivamente ou WebSocket não conseguiu reconectar */
  hasConnectionError: boolean;
}

const POLL_INTERVAL_MS = 10_000;
const STALE_THRESHOLD_MS = 10 * 60 * 1000;
const MAX_CONSECUTIVE_FAILURES = 3;

export function useGpsLiveTracking(linhaId: string | null): GpsLiveState {
  const [position, setPosition] = useState<LiveLocationPayload | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const consecutiveFailuresRef = useRef(0);

  // Detecta staleness sempre que position muda — re-verifica a cada 60s
  useEffect(() => {
    if (!position) {
      setIsStale(false);
      return;
    }
    const check = () => {
      const ageMs = Date.now() - new Date(position.updatedAt).getTime();
      setIsStale(ageMs > STALE_THRESHOLD_MS);
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [position]);

  useEffect(() => {
    if (!linhaId) {
      setPosition(null);
      setHasConnectionError(false);
      return;
    }

    // Authenticated: use WebSocket for real-time updates
    if (accessToken) {
      const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
      if (!apiUrl) return;

      const socket = io(`${apiUrl}/gps`, {
        transports: ['websocket'],
        extraHeaders: { authorization: `Bearer ${accessToken}` },
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });

      socketRef.current = socket;
      const channel = `tenant:${tenantSlug}:linha:${linhaId}`;

      socket.on(channel, (data: LiveLocationPayload) => {
        setPosition(data);
        setHasConnectionError(false);
      });

      socket.on('reconnect_failed', () => {
        setHasConnectionError(true);
      });

      socket.on('connect', () => {
        setHasConnectionError(false);
      });

      return () => {
        socket.off(channel);
        socket.disconnect();
        socketRef.current = null;
        setPosition(null);
        setHasConnectionError(false);
      };
    }

    // Anonymous: poll HTTP endpoint
    consecutiveFailuresRef.current = 0;
    const poll = async () => {
      if (getApiStatus() === 'offline') return;
      try {
        const url = resolveApiEndpoint(`/v1/gps/location/${encodeURIComponent(linhaId)}`);
        const res = await fetch(url, { headers: withTenantHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: LiveLocationPayload | null = (await res.json()) as LiveLocationPayload | null;
        consecutiveFailuresRef.current = 0;
        setHasConnectionError(false);
        if (data) setPosition(data);
      } catch {
        consecutiveFailuresRef.current += 1;
        if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
          setHasConnectionError(true);
        }
      }
    };

    void poll();
    const id = setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);
    pollRef.current = id;

    return () => {
      clearInterval(id);
      pollRef.current = null;
      setPosition(null);
      setHasConnectionError(false);
    };
  }, [linhaId, accessToken]);

  return { position, isStale, hasConnectionError };
}
