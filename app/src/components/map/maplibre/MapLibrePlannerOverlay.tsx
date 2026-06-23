import type { FeatureCollection } from 'geojson';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { useRotasData } from '@/contexts/RotasDataContext';
import type { Linha } from '@/types/data.types';
import { usePlannerStore } from '@/features/planner/store/plannerStore';
import type { PlannerBusLeg } from '@/features/planner/types';

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

export function MapLibrePlannerOverlay() {
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

  const geojson = useMemo<FeatureCollection>(() => {
    if (!plannerResults || !selectedRouteId) {
      return { type: 'FeatureCollection', features: [] };
    }
    const route = plannerResults.alternatives.find((a) => a.routeId === selectedRouteId);
    if (!route) return { type: 'FeatureCollection', features: [] };

    const features = route.legs.flatMap((leg) => {
      if (leg.pathCoordinates.length < 2) return [];

      let positions: [number, number][];

      if (leg.kind === 'bus') {
        const busLeg = leg as PlannerBusLeg;
        const linha = lineMap.get(busLeg.lineId);
        const traj = linha?.coordenadasTrajeto;
        positions =
          traj && traj.length >= 2
            ? sliceTraj(
                traj,
                leg.pathCoordinates[0] as [number, number],
                leg.pathCoordinates[leg.pathCoordinates.length - 1] as [number, number],
              )
            : (leg.pathCoordinates as [number, number][]);
      } else {
        positions = leg.pathCoordinates as [number, number][];
      }

      const busLeg = leg.kind === 'bus' ? (leg as PlannerBusLeg) : null;

      return [
        {
          type: 'Feature' as const,
          properties: {
            kind: leg.kind,
            color: busLeg?.lineColorHex ?? '#6b7280',
          },
          geometry: {
            type: 'LineString' as const,
            // [lat, lng] → [lng, lat]
            coordinates: positions.map(([lat, lng]) => [lng, lat]),
          },
        },
      ];
    });

    return { type: 'FeatureCollection', features };
  }, [plannerResults, selectedRouteId, lineMap]);

  if (geojson.features.length === 0) return null;

  return (
    <Source id="planner-overlay" type="geojson" data={geojson}>
      {/* Trechos de caminhada — tracejado cinza */}
      <Layer
        id="planner-walk"
        type="line"
        filter={['==', ['get', 'kind'], 'walk']}
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-color': '#6b7280',
          'line-width': 3,
          'line-dasharray': [6, 6],
          'line-opacity': 0.9,
        }}
      />
      {/* Trechos de ônibus — cor da linha */}
      <Layer
        id="planner-bus"
        type="line"
        filter={['==', ['get', 'kind'], 'bus']}
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-color': ['get', 'color'],
          'line-width': 5,
          'line-opacity': 0.9,
        }}
      />
    </Source>
  );
}
