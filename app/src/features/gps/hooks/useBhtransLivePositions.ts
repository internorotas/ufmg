import { useEffect, useState } from 'react';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';

export interface BhtransVehiclePosition {
  vehicleId: string;
  linhaId: string;
  lat: number;
  lng: number;
  recordedAt: string;
}

const POLL_INTERVAL_MS = 20_000;

export function useBhtransLivePositions(): BhtransVehiclePosition[] {
  const [positions, setPositions] = useState<BhtransVehiclePosition[]>([]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(resolveApiEndpoint('/v1/transit/bhtrans/live'), {
          headers: withTenantHeaders(),
        });
        if (res.ok && !cancelled) {
          const data = (await res.json()) as BhtransVehiclePosition[];
          setPositions(data);
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

  return positions;
}
