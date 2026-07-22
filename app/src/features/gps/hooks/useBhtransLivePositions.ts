import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getApiStatus } from '@/hooks/useApiAvailability';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';
import { UFMG_BHTRANS_LINE_IDS } from '../config/bhtransLines';

export interface BhtransVehiclePosition {
  vehicleId: string;
  linhaId: string;
  nome: string;
  lat: number;
  lng: number;
  recordedAt: string;
}

export interface BhtransLiveState {
  positions: BhtransVehiclePosition[];
  fetchedAt: string | null;
}

// Espelha o filtro do backend — defesa em profundidade contra regressões de deploy.
const UFMG_LINE_IDS = new Set(UFMG_BHTRANS_LINE_IDS);

const POLL_AUTHENTICATED_MS = 10_000;
const POLL_ANONYMOUS_MS = 20_000;

export function useBhtransLivePositions(): BhtransLiveState {
  const [state, setState] = useState<BhtransLiveState>({ positions: [], fetchedAt: null });

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (getApiStatus() === 'offline') return;
      try {
        const { accessToken } = useAuthStore.getState();
        const headers = withTenantHeaders();
        if (accessToken) {
          headers.set('Authorization', `Bearer ${accessToken}`);
        }
        const res = await fetch(resolveApiEndpoint('/v1/transit/bhtrans/live'), { headers });
        if (res.ok && !cancelled) {
          const data = (await res.json()) as BhtransVehiclePosition[];
          const filtered = data.filter((p) => UFMG_LINE_IDS.has(p.linhaId));
          setState({ positions: filtered, fetchedAt: new Date().toISOString() });
        }
      } catch {
        // BHTrans é fonte auxiliar — ignora falhas silenciosamente
      }
    };

    void poll();
    const interval = useAuthStore.getState().isAuthenticated
      ? POLL_AUTHENTICATED_MS
      : POLL_ANONYMOUS_MS;
    const id = setInterval(() => void poll(), interval);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return state;
}
