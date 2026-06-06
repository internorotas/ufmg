import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/store/authStore';
import { tenantSlug } from '@/tenants/tenantConfig';

export interface LiveLocationPayload {
  lat: number;
  lng: number;
  heading: number | null;
  confidence: number;
  updatedAt: string;
}

export function useGpsLiveTracking(linhaId: string | null): LiveLocationPayload | null {
  const [position, setPosition] = useState<LiveLocationPayload | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!linhaId || !accessToken) {
      setPosition(null);
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (!apiUrl) {
      return;
    }

    const socket = io(`${apiUrl}/gps`, {
      // WebSocket puro evita CORS do polling HTTP
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

    socket.on('disconnect', () => {
      // mantém última posição conhecida ao desconectar
    });

    return () => {
      socket.off(channel);
      socket.disconnect();
      socketRef.current = null;
      setPosition(null);
    };
  }, [linhaId, accessToken]);

  return position;
}
