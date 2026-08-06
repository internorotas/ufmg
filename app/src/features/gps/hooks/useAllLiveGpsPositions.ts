import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getAllLiveGpsPositions, type LiveGpsBatchItem } from '@/features/gps/api/gpsClient';
import { getApiStatus } from '@/hooks/useApiAvailability';

const POLL_INTERVAL_MS = 10_000;

// Overview de todas as linhas com GPS ao vivo (mapa colaborativo) — uma única
// requisição em lote em vez de N chamadas por linha. Não substitui
// useGpsLiveTracking (WebSocket + fallback), que segue exclusivo da linha
// travada pela sessão do próprio usuário.
export function useAllLiveGpsPositions(): Map<string, LiveGpsBatchItem> {
  const [positions, setPositions] = useState<Map<string, LiveGpsBatchItem>>(new Map());
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll(): Promise<void> {
      if (cancelled) return;
      if (getApiStatus() !== 'offline') {
        try {
          const items = await getAllLiveGpsPositions(accessToken ?? null);
          if (!cancelled) {
            setPositions(new Map(items.map((item) => [item.linhaId, item])));
          }
        } catch {
          // Falha transitória: mantém o último estado conhecido até a próxima tentativa.
        }
      }
      if (!cancelled) timer = setTimeout(() => void poll(), POLL_INTERVAL_MS);
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [accessToken]);

  return positions;
}
