import { useEffect, useState } from 'react';
import { getApiStatus } from '@/hooks/useApiAvailability';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';

export interface BhtransVehiclePosition {
  vehicleId: string;
  linhaId: string;
  nome: string;
  lat: number;
  lng: number;
  recordedAt: string;
}

export type BhtransLiveStatus =
  | 'loading'
  | 'healthy_with_vehicles'
  | 'healthy_without_vehicles'
  | 'degraded'
  | 'stale'
  | 'schema_not_ready'
  | 'unavailable';

export interface BhtransLiveState {
  status: BhtransLiveStatus;
  positions: BhtransVehiclePosition[];
  fetchedAt: string | null;
}

const POLL_AUTHENTICATED_MS = 10_000;
const POLL_ANONYMOUS_MS = 20_000;
const MAX_BACKOFF_MS = 120_000;
const BHTRANS_SCHEMA_NOT_READY_CODE = 'BHTRANS_SCHEMA_NOT_READY';

function jitter(ms: number): number {
  return ms + Math.random() * ms * 0.3;
}

// P0.4 (frontend) — endpoints /transit/bhtrans/* são públicos: enviar
// Authorization não muda a resposta e um token expirado nunca deve poder
// derrubar um recurso público. `withTenantHeaders()` já cobre o tenant.
export function useBhtransLivePositions(isAuthenticated: boolean): BhtransLiveState {
  const [state, setState] = useState<BhtransLiveState>({
    status: 'loading',
    positions: [],
    fetchedAt: null,
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight: AbortController | null = null;
    let consecutiveFailures = 0;

    const basePollMs = isAuthenticated ? POLL_AUTHENTICATED_MS : POLL_ANONYMOUS_MS;

    const scheduleNext = (delayMs: number) => {
      if (cancelled) return;
      timer = setTimeout(() => void poll(), delayMs);
    };

    const poll = async () => {
      if (document.hidden || getApiStatus() === 'offline') {
        scheduleNext(basePollMs);
        return;
      }
      inFlight?.abort();
      const controller = new AbortController();
      inFlight = controller;

      try {
        const res = await fetch(resolveApiEndpoint('/v1/transit/bhtrans/live'), {
          headers: withTenantHeaders(),
          signal: controller.signal,
        });
        if (cancelled) return;

        if (res.status === 503) {
          const body = await res.json().catch(() => null);
          if (body?.code === BHTRANS_SCHEMA_NOT_READY_CODE) {
            consecutiveFailures = 0;
            setState((prev) => ({ ...prev, status: 'schema_not_ready' }));
            scheduleNext(basePollMs);
            return;
          }
          throw new Error(`bhtrans/live 503 inesperado: ${body?.code ?? 'sem código'}`);
        }
        if (!res.ok) {
          throw new Error(`bhtrans/live respondeu ${res.status}`);
        }

        const ingestionStatus = res.headers.get('X-Bhtrans-Status');
        const data = (await res.json()) as BhtransVehiclePosition[];
        consecutiveFailures = 0;

        if (ingestionStatus === 'degraded' || ingestionStatus === 'error') {
          setState((prev) => ({
            status: prev.positions.length > 0 ? 'stale' : 'degraded',
            positions: prev.positions.length > 0 ? prev.positions : data,
            fetchedAt: prev.fetchedAt,
          }));
        } else {
          setState({
            status: data.length > 0 ? 'healthy_with_vehicles' : 'healthy_without_vehicles',
            positions: data,
            fetchedAt: new Date().toISOString(),
          });
        }
        scheduleNext(basePollMs);
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        consecutiveFailures += 1;
        // biome-ignore lint/suspicious/noConsole: falha de fonte auxiliar precisa ficar visível no console para diagnóstico
        console.error('[bhtrans] falha ao consultar posições ao vivo', err);
        setState((prev) => ({
          status: prev.positions.length > 0 ? 'stale' : 'unavailable',
          positions: prev.positions,
          fetchedAt: prev.fetchedAt,
        }));
        const backoff = Math.min(basePollMs * 2 ** consecutiveFailures, MAX_BACKOFF_MS);
        scheduleNext(jitter(backoff));
      }
    };

    void poll();
    const onVisibilityChange = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      inFlight?.abort();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated]);

  return state;
}
