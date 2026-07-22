import { useSyncExternalStore } from 'react';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';

export type ApiStatus = 'unknown' | 'healthy' | 'degraded' | 'offline';

// --- Singleton: uma única verificação para toda a aplicação ---
let status: ApiStatus = 'unknown';
let consecutiveFailures = 0;
let timerId: ReturnType<typeof setTimeout> | null = null;
let checkInFlight = false;
const subscribers = new Set<() => void>();

const OFFLINE_THRESHOLD = 3;
const HEALTHY_POLL_MS = 60_000;
// Backoff: 15s → 30s → 60s → 120s → 300s (cap)
const BACKOFF_DELAYS_MS = [15_000, 30_000, 60_000, 120_000, 300_000];

function notify() {
  for (const cb of subscribers) cb();
}

function setStatus(next: ApiStatus) {
  if (next === status) return;
  status = next;
  notify();
}

export function getApiStatus(): ApiStatus {
  return status;
}

function scheduleCheck(delayMs: number) {
  if (timerId !== null) clearTimeout(timerId);
  timerId = setTimeout(() => {
    timerId = null;
    void runCheck();
  }, delayMs);
}

async function runCheck(): Promise<void> {
  if (checkInFlight) return;
  checkInFlight = true;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5_000);
  try {
    const res = await fetch(resolveApiEndpoint('/health'), {
      method: 'GET',
      cache: 'no-store',
      headers: withTenantHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      consecutiveFailures = 0;
      setStatus('healthy');
      scheduleCheck(HEALTHY_POLL_MS);
    } else {
      consecutiveFailures++;
      setStatus(consecutiveFailures >= OFFLINE_THRESHOLD ? 'offline' : 'degraded');
      const idx = Math.min(consecutiveFailures - 1, BACKOFF_DELAYS_MS.length - 1);
      scheduleCheck(BACKOFF_DELAYS_MS[idx]);
    }
  } catch {
    clearTimeout(timeoutId);
    consecutiveFailures++;
    setStatus(consecutiveFailures >= OFFLINE_THRESHOLD ? 'offline' : 'degraded');
    const idx = Math.min(consecutiveFailures - 1, BACKOFF_DELAYS_MS.length - 1);
    scheduleCheck(BACKOFF_DELAYS_MS[idx]);
  } finally {
    checkInFlight = false;
  }
}

export function retryApiNow(): void {
  consecutiveFailures = 0;
  void runCheck();
}

// Verifica imediatamente ao importar
void runCheck();

// Reinicia verificação quando o navegador recupera conexão
if (typeof window !== 'undefined') {
  window.addEventListener('online', retryApiNow);
}

// useSyncExternalStore
function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function getSnapshot(): ApiStatus {
  return status;
}

function getServerSnapshot(): ApiStatus {
  return 'unknown';
}

export function useApiAvailability(): { apiStatus: ApiStatus; retryApiNow: typeof retryApiNow } {
  const apiStatus = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { apiStatus, retryApiNow };
}
