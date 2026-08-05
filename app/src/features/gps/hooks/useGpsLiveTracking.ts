import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { fetchAuthenticatedApi } from '@/features/auth/api/fetchAuthenticatedApi';
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
  /** true se updatedAt > STALE_THRESHOLD_MS — posição não está mais sendo atualizada */
  isStale: boolean;
  /** true após falhas reais consecutivas de conexão (nunca por 404 — GPS ainda indisponível) */
  hasConnectionError: boolean;
}

const POLL_INTERVAL_MS = 10_000;
// Contrato único com backend/src/gps/gps-share.service.ts (STALE_THRESHOLD_MS) e
// MapLibreGpsLiveBusMarker (que lê isStale diretamente daqui, sem recalcular).
const STALE_THRESHOLD_MS = 5 * 60 * 1000;
const MAX_CONSECUTIVE_FAILURES = 3;

export function useGpsLiveTracking(linhaId: string | null): GpsLiveState {
  const [position, setPosition] = useState<LiveLocationPayload | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const consecutiveFailuresRef = useRef(0);

  // Detecta staleness sempre que position muda — re-verifica periodicamente.
  // Uma falha transitória de rede nunca apaga a última posição válida; ela só
  // vira "stale" conforme o tempo passa, nunca some de imediato.
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
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [position]);

  useEffect(() => {
    if (!linhaId) {
      setPosition(null);
      setHasConnectionError(false);
      consecutiveFailuresRef.current = 0;
      return;
    }

    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let pollScheduled = false;

    const schedulePoll = (delayMs: number) => {
      if (cancelled) return;
      if (pollTimer) clearTimeout(pollTimer);
      pollScheduled = true;
      pollTimer = setTimeout(() => {
        pollScheduled = false;
        void poll();
      }, delayMs);
    };

    const stopPoll = () => {
      pollScheduled = false;
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
    };

    // Bootstrap HTTP imediato — todo usuário (autenticado ou anônimo) vê uma
    // posição assim que abre a linha, sem esperar o handshake do WebSocket.
    // Autenticado usa fetchAuthenticatedApi (JWT + refresh automático em 401,
    // posição sem atraso); anônimo usa fetch simples com atraso de 60s no
    // backend (X-Gps-Delay-Seconds).
    async function poll(): Promise<void> {
      if (cancelled) return;
      if (getApiStatus() === 'offline') {
        schedulePoll(POLL_INTERVAL_MS);
        return;
      }

      try {
        const url = resolveApiEndpoint(`/v1/gps/location/${encodeURIComponent(linhaId ?? '')}`);
        const res = accessToken
          ? await fetchAuthenticatedApi(url)
          : await fetch(url, { headers: withTenantHeaders() });

        if (res.status === 404) {
          // Posição GPS ainda indisponível para a linha — não é falha de conexão.
          consecutiveFailuresRef.current = 0;
          setHasConnectionError(false);
          setPosition(null);
          schedulePoll(POLL_INTERVAL_MS);
          return;
        }

        if (res.status === 429) {
          const retryAfterHeader = res.headers.get('Retry-After');
          const retryAfterMs = retryAfterHeader
            ? Number.parseInt(retryAfterHeader, 10) * 1000
            : POLL_INTERVAL_MS;
          schedulePoll(Number.isFinite(retryAfterMs) ? retryAfterMs : POLL_INTERVAL_MS);
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: LiveLocationPayload | null = (await res.json()) as LiveLocationPayload | null;
        consecutiveFailuresRef.current = 0;
        setHasConnectionError(false);
        if (data) setPosition(data);
        schedulePoll(POLL_INTERVAL_MS);
      } catch {
        consecutiveFailuresRef.current += 1;
        if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
          setHasConnectionError(true);
        }
        schedulePoll(POLL_INTERVAL_MS);
      }
    }

    void poll();

    // Anônimo: só polling HTTP, sempre respeitando o atraso público do backend.
    if (!accessToken) {
      return () => {
        cancelled = true;
        stopPoll();
        setPosition(null);
        setHasConnectionError(false);
      };
    }

    // Autenticado: WebSocket para tempo real. O polling acima já rodou uma vez
    // (bootstrap) e continua ativo até o socket conectar; se o socket cair, o
    // polling volta a ser ativado como fallback temporário.
    const apiOrigin = import.meta.env.VITE_API_URL as string | undefined;
    if (!apiOrigin) {
      return () => {
        cancelled = true;
        stopPoll();
        setPosition(null);
        setHasConnectionError(false);
      };
    }

    const socket: Socket = io(`${apiOrigin}/gps`, {
      transports: ['websocket'],
      auth: {
        token: accessToken,
      },
      query: {
        tenantSlug,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    // Sala de tenant é detalhe interno do backend (tenant:<slug>) — o cliente
    // só escuta o evento por linha, nunca o nome do room.
    const channel = `linha:${linhaId}`;

    const handleChannelData = (data: LiveLocationPayload) => {
      setPosition(data);
      setHasConnectionError(false);
      consecutiveFailuresRef.current = 0;
    };

    const handleConnect = () => {
      setHasConnectionError(false);
      // Conexão saudável — interrompe o polling de fallback.
      stopPoll();
    };

    const handleConnectError = () => {
      // Socket ainda tentando conectar (ou reconectar) — mantém posição
      // atualizada via polling HTTP enquanto isso.
      if (!pollScheduled) schedulePoll(POLL_INTERVAL_MS);
    };

    const handleDisconnect = () => {
      if (!pollScheduled) schedulePoll(POLL_INTERVAL_MS);
    };

    const handleReconnectAttempt = () => {
      if (!pollScheduled) schedulePoll(POLL_INTERVAL_MS);
    };

    const handleReconnect = () => {
      setHasConnectionError(false);
      stopPoll();
    };

    const handleReconnectFailed = () => {
      setHasConnectionError(true);
      if (!pollScheduled) schedulePoll(POLL_INTERVAL_MS);
    };

    socket.on(channel, handleChannelData);
    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleReconnect);
    socket.io.on('reconnect_failed', handleReconnectFailed);

    return () => {
      cancelled = true;
      stopPoll();
      socket.off(channel, handleChannelData);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleReconnect);
      socket.io.off('reconnect_failed', handleReconnectFailed);
      socket.disconnect();
      setPosition(null);
      setHasConnectionError(false);
    };
  }, [linhaId, accessToken]);

  return { position, isStale, hasConnectionError };
}
