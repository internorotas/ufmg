// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlannerStore } from '../store/plannerStore';
import type { PlannerRoutesResponse } from '../types';
import { PlannerSummarySheet } from './PlannerSummarySheet';

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

describe('PlannerSummarySheet', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    usePlannerStore.setState({ plannerResults: mockResults, selectedRouteId: 'route-1' });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    usePlannerStore.getState().reset();
    usePlannerStore.setState({ plannerResults: null });
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false);
  });

  function renderSheet(props: {
    isOpen: boolean;
    onClose?: () => void;
    onBackToResults?: () => void;
  }) {
    act(() => {
      root.render(
        <PlannerSummarySheet
          isOpen={props.isOpen}
          onClose={props.onClose ?? vi.fn()}
          onBackToResults={props.onBackToResults ?? vi.fn()}
        />,
      );
    });
  }

  it('não renderiza nada quando isOpen=false', () => {
    renderSheet({ isOpen: false });
    expect(document.querySelector('[data-slot="planner-summary-sheet"]')).toBeNull();
  });

  it('renderiza o sheet quando isOpen=true', () => {
    renderSheet({ isOpen: true });
    expect(document.querySelector('[data-slot="planner-summary-sheet"]')).not.toBeNull();
    expect(document.body.textContent).toContain('Voltar aos resultados');
  });

  it('exibe o itinerário selecionado', () => {
    renderSheet({ isOpen: true });
    expect(document.body.textContent).toContain('25 min');
    expect(document.body.textContent).toContain('09:25');
    expect(document.body.textContent).toContain('Circular UFMG');
  });

  it('chama onBackToResults no botão de retorno', () => {
    const onBackToResults = vi.fn();
    renderSheet({ isOpen: true, onBackToResults });
    const button = document.querySelector('[data-slot="back-to-results"]') as HTMLButtonElement;
    act(() => {
      button.click();
    });
    expect(onBackToResults).toHaveBeenCalledOnce();
  });

  it('chama onClose no botão X', () => {
    const onClose = vi.fn();
    renderSheet({ isOpen: true, onClose });
    const sheet = document.querySelector('[data-slot="planner-summary-sheet"]') as HTMLElement;
    const closeButton = Array.from(sheet.querySelectorAll('button')).find(
      (button) => button.getAttribute('aria-label') === 'Fechar resumo',
    ) as HTMLButtonElement;
    act(() => {
      closeButton.click();
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('chama onClose ao pressionar ESC', () => {
    const onClose = vi.fn();
    renderSheet({ isOpen: true, onClose });
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
