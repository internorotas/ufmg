/**
 * PlannerMapOverlay — renderiza o itinerário selecionado no mapa.
 * Bus: usa coordenadasTrajeto da linha (geometria real das ruas).
 * Caminhada: usa OSRM foot routing com fallback para linha reta.
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import { useRotasData } from '@/contexts/RotasDataContext';
import type { Linha } from '@/types/data.types';
import { usePlannerStore } from '../store/plannerStore';
import type { PlannerBusLeg, PlannerCoordinate, PlannerWalkLeg } from '../types';

// ---------------------------------------------------------------------------
// Helpers de geometria
// ---------------------------------------------------------------------------

function nearestIdx(
  traj: readonly [number, number][],
  target: readonly [number, number],
  from = 0,
): number {
  let best = from;
  let bestD = Infinity;
  for (let i = from; i < traj.length; i++) {
    const d = (traj[i][0] - target[0]) ** 2 + (traj[i][1] - target[1]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function sliceTraj(
  traj: [number, number][],
  start: [number, number],
  end: [number, number],
): [number, number][] {
  if (traj.length < 2) return [start, end];
  const s = nearestIdx(traj, start);
  const e = nearestIdx(traj, end, s);
  return s < e ? traj.slice(s, e + 1) : [start, end];
}

// ---------------------------------------------------------------------------
// OSRM pedestrian routing
// ---------------------------------------------------------------------------

async function fetchOsrmWalk(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): Promise<[number, number][]> {
  const base =
    (typeof import.meta !== 'undefined' &&
      (import.meta as { env?: Record<string, string> }).env?.VITE_OSRM_URL) ??
    'https://router.project-osrm.org';
  const url = `${base}/route/v1/foot/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`osrm ${res.status}`);
  const data = await res.json();
  return (data.routes[0].geometry.coordinates as [number, number][]).map(
    ([lon, lat]) => [lat, lon] as [number, number],
  );
}

// ---------------------------------------------------------------------------
// WalkPolyline — trecho a pé com rota real via OSRM
// ---------------------------------------------------------------------------

function WalkPolyline({ leg, legKey }: { leg: PlannerWalkLeg; legKey: string }) {
  const start = leg.pathCoordinates[0] as [number, number];
  const end = leg.pathCoordinates[leg.pathCoordinates.length - 1] as [number, number];

  const { data: osrmCoords } = useQuery({
    queryKey: ['osrm-walk', legKey],
    queryFn: () => fetchOsrmWalk(start[0], start[1], end[0], end[1]),
    staleTime: Infinity,
    retry: 1,
    enabled: Boolean(start && end),
  });

  return (
    <Polyline
      positions={(osrmCoords ?? leg.pathCoordinates) as PlannerCoordinate[]}
      color="#6b7280"
      weight={3}
      dashArray="6 6"
      opacity={0.9}
    />
  );
}

// ---------------------------------------------------------------------------
// PlannerMapOverlay
// ---------------------------------------------------------------------------

export function PlannerMapOverlay() {
  const plannerResults = usePlannerStore((s) => s.plannerResults);
  const selectedRouteId = usePlannerStore((s) => s.selectedRouteId);
  const { linhasData } = useRotasData();

  const lineMap = useMemo(() => {
    const m = new Map<string, Linha>();
    for (const cat of linhasData.categoriasDias) {
      for (const l of cat.linhas) {
        m.set(l.idRota, l);
      }
    }
    return m;
  }, [linhasData]);

  if (!plannerResults || !selectedRouteId) {
    return null;
  }

  const route = plannerResults.alternatives.find((a) => a.routeId === selectedRouteId);
  if (!route) {
    return null;
  }

  return (
    <>
      {route.legs.map((leg) => {
        if (leg.pathCoordinates.length < 2) {
          return null;
        }

        const legKey = `${route.routeId}:${leg.kind}:${leg.fromStopId}:${leg.toStopId}:${leg.pathStopIds.join('>')}`;

        if (leg.kind === 'walk') {
          return <WalkPolyline key={legKey} leg={leg} legKey={legKey} />;
        }

        const busLeg = leg as PlannerBusLeg;
        const linha = lineMap.get(busLeg.lineId);
        const traj = linha?.coordenadasTrajeto;

        const positions =
          traj && traj.length >= 2
            ? sliceTraj(
                traj,
                leg.pathCoordinates[0] as [number, number],
                leg.pathCoordinates[leg.pathCoordinates.length - 1] as [number, number],
              )
            : (leg.pathCoordinates as PlannerCoordinate[]);

        return (
          <Polyline
            key={legKey}
            positions={positions}
            color={busLeg.lineColorHex}
            weight={5}
            opacity={0.9}
          />
        );
      })}
    </>
  );
}
