// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlannerStore } from '../store/plannerStore';
import type { PlannerRoutesResponse } from '../types';
import { PlannerMapOverlay } from './PlannerMapOverlay';

vi.mock('react-leaflet', () => ({
  Polyline: ({
    color,
    dashArray,
    'data-testid': testId,
  }: {
    color: string;
    dashArray?: string;
    'data-testid'?: string;
  }) => <div data-testid={testId ?? 'polyline'} data-color={color} data-dash={dashArray ?? ''} />,
}));

const mockResults: PlannerRoutesResponse = {
  originStopId: 'A',
  originStopName: 'Parada A',
  destinationStopId: 'B',
  destinationStopName: 'Parada B',
  generatedAt: '2026-01-01T00:00:00Z',
  alternatives: [
    {
      routeId: 'route-1',
      totalMinutes: 25,
      walkingMinutes: 5,
      walkingDistanceMeters: 300,
      transferCount: 0,
      arrivalTime: '09:25',
      etaBadges: [{ source: 'scheduled', confidenceLabel: 'previsão aproximada' }],
      legs: [
        {
          kind: 'walk',
          fromStopId: 'A',
          toStopId: 'X',
          fromStopName: 'Parada A',
          toStopName: 'Parada X',
          minutes: 5,
          distanceMeters: 300,
          pathStopIds: ['A', 'X'],
          pathCoordinates: [
            [19.87, -43.97],
            [19.875, -43.975],
          ],
        },
        {
          kind: 'bus',
          fromStopId: 'X',
          toStopId: 'B',
          fromStopName: 'Parada X',
          toStopName: 'Parada B',
          minutes: 20,
          distanceMeters: 1500,
          pathStopIds: ['X', 'B'],
          pathCoordinates: [
            [19.875, -43.975],
            [19.88, -43.98],
          ],
          lineId: 'L10',
          lineName: 'Circular UFMG',
          lineNumber: 10,
          categoryDay: 'diasUteis',
          lineColorHex: '#e63946',
          eta: {
            source: 'scheduled',
            etaMinutes: 8,
            confidenceLabel: 'previsão aproximada',
            updatedAt: null,
          },
          boardingEtaMinutes: 8,
          arrivalEtaMinutes: 28,
          boardingTime: '09:05',
          arrivalTime: '09:25',
        },
      ],
    },
  ],
};

describe('PlannerMapOverlay', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    usePlannerStore.setState({ plannerResults: null, selectedRouteId: null });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false);
  });

  function renderOverlay() {
    act(() => {
      root.render(<PlannerMapOverlay />);
    });
  }

  it('não renderiza polyline sem plannerResults', () => {
    renderOverlay();
    expect(container.querySelectorAll('[data-testid="polyline"]').length).toBe(0);
  });

  it('não renderiza polyline sem selectedRouteId', () => {
    usePlannerStore.setState({ plannerResults: mockResults, selectedRouteId: null });
    renderOverlay();
    expect(container.querySelectorAll('[data-testid="polyline"]').length).toBe(0);
  });

  it('renderiza uma polyline por leg da rota selecionada', () => {
    usePlannerStore.setState({ plannerResults: mockResults, selectedRouteId: 'route-1' });
    renderOverlay();
    expect(container.querySelectorAll('[data-testid="polyline"]').length).toBe(2);
  });

  it('usa cor da linha no trecho de ônibus', () => {
    usePlannerStore.setState({ plannerResults: mockResults, selectedRouteId: 'route-1' });
    renderOverlay();
    const polylines = container.querySelectorAll('[data-testid="polyline"]');
    expect((polylines[1] as HTMLElement).getAttribute('data-color')).toBe('#e63946');
    expect((polylines[1] as HTMLElement).getAttribute('data-dash')).toBe('');
  });

  it('usa cinza tracejado no trecho a pé', () => {
    usePlannerStore.setState({ plannerResults: mockResults, selectedRouteId: 'route-1' });
    renderOverlay();
    const walkPolyline = container.querySelectorAll('[data-testid="polyline"]')[0] as HTMLElement;
    expect(walkPolyline.getAttribute('data-color')).toBe('#6b7280');
    expect(walkPolyline.getAttribute('data-dash')).toBe('6 6');
  });
});
