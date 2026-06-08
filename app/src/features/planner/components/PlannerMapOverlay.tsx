/**
 * PlannerMapOverlay — renderiza o itinerário selecionado no mapa.
 * Bus: usa coordenadasTrajeto da linha (geometria real das ruas).
 * Caminhada: linha reta com pathCoordinates.
 */

import { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import { useRotasData } from '@/contexts/RotasDataContext';
import type { Linha } from '@/types/data.types';
import { usePlannerStore } from '../store/plannerStore';
import type { PlannerBusLeg, PlannerCoordinate } from '../types';

// ---------------------------------------------------------------------------
// Helpers de geometria
// ---------------------------------------------------------------------------

function nearestIdx(traj: readonly [number, number][], target: readonly [number, number]): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < traj.length; i++) {
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
  const e = nearestIdx(traj, end);
  if (s === e) return [start, end];
  if (s < e) return traj.slice(s, e + 1);
  return traj.slice(e, s + 1).reverse();
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
          return (
            <Polyline
              key={legKey}
              positions={leg.pathCoordinates as PlannerCoordinate[]}
              color="#6b7280"
              weight={3}
              dashArray="6 6"
              opacity={0.9}
            />
          );
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
