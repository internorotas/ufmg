import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const TTL_MS = 120_000;
const REFRESH_BEFORE_EXPIRY_MS = 20_000;

interface TransitSessionState {
  transitToken: string | null;
  turnstileReady: boolean;
  disabled: boolean;
}

interface TransitSession extends TransitSessionState {
  onTurnstileSuccess: (token: string) => Promise<void>;
  onTurnstileError: () => void;
}

async function exchangeForTransitToken(turnstileToken: string): Promise<string | null> {
  try {
    const endpoint = resolveApiEndpoint('/v1/transit/session');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: withTenantHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ turnstileToken }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { transitToken?: string };
    return data.transitToken ?? null;
  } catch {
    return null;
  }
}

export function useTransitSession(): TransitSession {
  const [state, setState] = useState<TransitSessionState>({
    transitToken: null,
    turnstileReady: false,
    disabled: !TURNSTILE_SITE_KEY,
  });

  const expiresAtRef = useRef<number>(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback((delayMs: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, turnstileReady: false, transitToken: null }));
    }, delayMs);
  }, []);

  const onTurnstileSuccess = useCallback(
    async (turnstileToken: string) => {
      const token = await exchangeForTransitToken(turnstileToken);
      if (!token) return;
      expiresAtRef.current = Date.now() + TTL_MS;
      setState({ transitToken: token, turnstileReady: true, disabled: false });
      scheduleRefresh(TTL_MS - REFRESH_BEFORE_EXPIRY_MS);
    },
    [scheduleRefresh],
  );

  const onTurnstileError = useCallback(() => {
    setState((prev) => ({ ...prev, turnstileReady: false, transitToken: null }));
  }, []);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  return { ...state, onTurnstileSuccess, onTurnstileError };
}
