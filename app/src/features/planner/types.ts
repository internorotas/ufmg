/**
 * Tipos do planner de rotas — espelham o contrato HTTP do backend.
 * Somente os tipos necessários para consumir a resposta de /v1/planner/routes.
 */

export type PlannerCoordinate = [number, number];

export type PlannerEtaSource = 'live' | 'historical' | 'scheduled';

export type PlannerConfidenceLabel =
  | 'alta confiança'
  | 'confiança moderada'
  | 'previsão aproximada';

export const ETA_SOURCE_LABEL: Record<PlannerEtaSource, string> = {
  live: 'Ao vivo',
  historical: 'Histórico',
  scheduled: 'Programado',
};

export interface PlannerEtaSummary {
  source: PlannerEtaSource;
  etaMinutes: number;
  confidenceLabel: PlannerConfidenceLabel;
  updatedAt: string | null;
}

export interface PlannerRouteSummaryBadge {
  source: PlannerEtaSource;
  confidenceLabel: PlannerConfidenceLabel;
}

interface PlannerRouteLegBase {
  kind: 'walk' | 'bus';
  fromStopId: string;
  toStopId: string;
  fromStopName: string;
  toStopName: string;
  minutes: number;
  distanceMeters: number;
  pathStopIds: string[];
  pathCoordinates: PlannerCoordinate[];
}

export interface PlannerWalkLeg extends PlannerRouteLegBase {
  kind: 'walk';
}

export interface PlannerBusLeg extends PlannerRouteLegBase {
  kind: 'bus';
  lineId: string;
  lineName: string;
  lineNumber: number | null;
  categoryDay: string;
  lineColorHex: string;
  eta: PlannerEtaSummary;
  boardingEtaMinutes: number;
  arrivalEtaMinutes: number;
  boardingTime: string;
  arrivalTime: string;
}

export type PlannerRouteLeg = PlannerWalkLeg | PlannerBusLeg;

export interface PlannerRouteAlternative {
  routeId: string;
  totalMinutes: number;
  walkingMinutes: number;
  walkingDistanceMeters: number;
  transferCount: number;
  arrivalTime: string;
  etaBadges: PlannerRouteSummaryBadge[];
  legs: PlannerRouteLeg[];
}

export interface PlannerRoutesResponse {
  originStopId: string;
  originStopName: string;
  destinationStopId: string;
  destinationStopName: string;
  generatedAt: string;
  alternatives: PlannerRouteAlternative[];
}

export interface PlannerClientQuery {
  originStopId: string;
  destinationStopId: string;
  categoryDay?: string;
}
