import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/store/authStore';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';
import { tenantSlug } from '@/tenants/tenantConfig';

export interface LiveLocationPayload {
  lat: number;
  lng: number;
  heading: number | null;
  confidence: number;
  updatedAt: string;
}

const POLL_INTERVAL_MS = 10_000;

export function useGpsLiveTracking(linhaId: string | null): LiveLocationPayload | null {
  const [position, setPosition] = useState<LiveLocationPayload | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!linhaId) {
      setPosition(null);
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
      });

      return () => {
        socket.off(channel);
        socket.disconnect();
        socketRef.current = null;
        setPosition(null);
      };
    }

    // Anonymous: poll HTTP endpoint every 15s
    const poll = async () => {
      try {
        const url = resolveApiEndpoint(`/v1/gps/location/${encodeURIComponent(linhaId)}`);
        const res = await fetch(url, { headers: withTenantHeaders() });
        if (!res.ok) return;
        const data: LiveLocationPayload | null = (await res.json()) as LiveLocationPayload | null;
        if (data) setPosition(data);
      } catch {
        // silently ignore — keeps last known position
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
    };
  }, [linhaId, accessToken]);

  return position;
}
