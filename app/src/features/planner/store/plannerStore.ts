import { create } from 'zustand';
import type { PlannerRoutesResponse } from '../types';

export type PlannerMode = 'idle' | 'planning';

export interface PlannerStop {
  kind: 'stop';
  idParada: string;
  nome: string;
}

export interface PlannerCurrentLocation {
  kind: 'current-location';
  nome: string;
}

export type PlannerEndpoint = PlannerStop | PlannerCurrentLocation;

interface PlannerState {
  mode: PlannerMode;
  origin: PlannerEndpoint | null;
  destination: PlannerEndpoint | null;
  selectedRouteId: string | null;
  plannerResults: PlannerRoutesResponse | null;
  openMenuFn: (() => void) | null;
  openPlanner: () => void;
  closePlanner: () => void;
  setOrigin: (endpoint: PlannerEndpoint | null) => void;
  setDestination: (endpoint: PlannerEndpoint | null) => void;
  swap: () => void;
  reset: () => void;
  setSelectedRouteId: (routeId: string | null) => void;
  setResults: (results: PlannerRoutesResponse | null) => void;
  registerOpenMenu: (fn: (() => void) | null) => void;
  isSameEndpoint: () => boolean;
  canPlan: () => boolean;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  mode: 'idle',
  origin: null,
  destination: null,
  selectedRouteId: null,
  plannerResults: null,
  openMenuFn: null,

  openPlanner: () => set({ mode: 'planning' }),
  closePlanner: () => set({ mode: 'idle' }),

  setOrigin: (endpoint) => set({ origin: endpoint }),
  setDestination: (endpoint) => set({ destination: endpoint }),

  swap: () =>
    set((state) => ({
      origin: state.destination,
      destination: state.origin,
    })),

  reset: () =>
    set({ origin: null, destination: null, selectedRouteId: null, plannerResults: null }),

  setSelectedRouteId: (routeId) => set({ selectedRouteId: routeId }),

  setResults: (results) => set({ plannerResults: results }),

  registerOpenMenu: (fn) => set({ openMenuFn: fn }),

  isSameEndpoint: () => {
    const { origin, destination } = get();
    if (!origin || !destination) return false;
    if (origin.kind === 'stop' && destination.kind === 'stop') {
      return origin.idParada === destination.idParada;
    }
    return origin.kind === 'current-location' && destination.kind === 'current-location';
  },

  canPlan: () => {
    const { origin, destination } = get();
    if (!origin || !destination) return false;
    if (origin.kind !== 'stop' || destination.kind !== 'stop') return false;
    return !get().isSameEndpoint();
  },
}));
