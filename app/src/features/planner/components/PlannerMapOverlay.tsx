/**
 * PlannerMapOverlay — renderiza o itinerário selecionado no mapa.
 */

import { Polyline } from 'react-leaflet';
import { usePlannerStore } from '../store/plannerStore';
import type { PlannerBusLeg, PlannerCoordinate } from '../types';

export function PlannerMapOverlay() {
  const plannerResults = usePlannerStore((state) => state.plannerResults);
  const selectedRouteId = usePlannerStore((state) => state.selectedRouteId);

  if (!plannerResults || !selectedRouteId) {
    return null;
  }

  const route = plannerResults.alternatives.find(
    (alternative) => alternative.routeId === selectedRouteId,
  );
  if (!route) {
    return null;
  }

  return (
    <>
      {route.legs.map((leg) => {
        if (leg.pathCoordinates.length < 2) {
          return null;
        }

        const isBus = leg.kind === 'bus';
        const color = isBus ? (leg as PlannerBusLeg).lineColorHex : '#6b7280';
        const legKey = `${route.routeId}:${leg.kind}:${leg.fromStopId}:${leg.toStopId}:${leg.pathStopIds.join('>')}`;

        return (
          <Polyline
            key={legKey}
            positions={leg.pathCoordinates as PlannerCoordinate[]}
            color={color}
            weight={isBus ? 5 : 3}
            dashArray={isBus ? undefined : '6 6'}
            opacity={0.9}
          />
        );
      })}
    </>
  );
}
