import { useEffect, useState } from 'react';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';
import { normalizeBhtransLineId, UFMG_BHTRANS_LINE_IDS } from '../config/bhtransLines';

export interface BhtransVehiclePosition {
  vehicleId: string;
  linhaId: string;
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

const POLL_INTERVAL_MS = 20_000;

export function useBhtransLivePositions(): BhtransLiveState {
  const [state, setState] = useState<BhtransLiveState>({ positions: [], fetchedAt: null });

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(resolveApiEndpoint('/v1/transit/bhtrans/live'), {
          headers: withTenantHeaders(),
        });
        if (res.ok && !cancelled) {
          const data = (await res.json()) as BhtransVehiclePosition[];
          const filtered = data
            .map((p) => ({ ...p, linhaId: normalizeBhtransLineId(p.linhaId) }))
            .filter((p) => UFMG_LINE_IDS.has(p.linhaId));
          setState({ positions: filtered, fetchedAt: new Date().toISOString() });
        }
      } catch {
        // BHTrans é fonte auxiliar — ignora falhas silenciosamente
      }
    };

    void poll();
    const id = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return state;
}
