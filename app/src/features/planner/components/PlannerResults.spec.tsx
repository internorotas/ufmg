// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlannerRoutesResponse } from '../types';
import { PlannerResults } from './PlannerResults';

const mockResults: PlannerRoutesResponse = {
  originStopId: 'A',
  originStopName: 'Parada A',
  destinationStopId: 'B',
  destinationStopName: 'Parada B',
  generatedAt: '2026-05-13T10:00:00.000Z',
  alternatives: [
    {
      routeId: 'rota-1',
      totalMinutes: 35,
      walkingMinutes: 8,
      walkingDistanceMeters: 620,
      transferCount: 1,
      arrivalTime: '10:35',
      etaBadges: [{ source: 'live', confidenceLabel: 'alta confiança' }],
      legs: [
        {
          kind: 'walk',
          fromStopId: 'A',
          toStopId: 'C',
          fromStopName: 'Parada A',
          toStopName: 'Parada C',
          minutes: 5,
          distanceMeters: 380,
          pathStopIds: ['A', 'C'],
          pathCoordinates: [],
        },
        {
          kind: 'bus',
          fromStopId: 'C',
          toStopId: 'B',
          fromStopName: 'Parada C',
          toStopName: 'Parada B',
          minutes: 22,
          distanceMeters: 3100,
          pathStopIds: ['C', 'D', 'B'],
          pathCoordinates: [],
          lineId: 'linha-10',
          lineName: 'Linha 10',
          lineNumber: 10,
          categoryDay: 'diasUteis',
          lineColorHex: '#2563eb',
          eta: {
            source: 'live',
            etaMinutes: 22,
            confidenceLabel: 'alta confiança',
            updatedAt: '2026-05-13T10:02:00.000Z',
          },
          boardingEtaMinutes: 3,
          arrivalEtaMinutes: 25,
          boardingTime: '10:03',
          arrivalTime: '10:25',
        },
      ],
    },
    {
      routeId: 'rota-2',
      totalMinutes: 42,
      walkingMinutes: 12,
      walkingDistanceMeters: 890,
      transferCount: 0,
      arrivalTime: '10:42',
      etaBadges: [{ source: 'historical', confidenceLabel: 'confiança moderada' }],
      legs: [
        {
          kind: 'walk',
          fromStopId: 'A',
          toStopId: 'E',
          fromStopName: 'Parada A',
          toStopName: 'Parada E',
          minutes: 12,
          distanceMeters: 890,
          pathStopIds: ['A', 'E'],
          pathCoordinates: [],
        },
        {
          kind: 'bus',
          fromStopId: 'E',
          toStopId: 'B',
          fromStopName: 'Parada E',
          toStopName: 'Parada B',
          minutes: 30,
          distanceMeters: 4200,
          pathStopIds: ['E', 'B'],
          pathCoordinates: [],
          lineId: 'linha-20',
          lineName: 'Linha 20',
          lineNumber: 20,
          categoryDay: 'diasUteis',
          lineColorHex: '#dc2626',
          eta: {
            source: 'historical',
            etaMinutes: 30,
            confidenceLabel: 'confiança moderada',
            updatedAt: null,
          },
          boardingEtaMinutes: 2,
          arrivalEtaMinutes: 32,
          boardingTime: '10:12',
          arrivalTime: '10:42',
        },
      ],
    },
  ],
};

function renderWithQuery(jsx: React.ReactElement, container: HTMLElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const root = createRoot(container);
  act(() => {
    root.render(<QueryClientProvider client={qc}>{jsx}</QueryClientProvider>);
  });
  return root;
}

describe('PlannerResults', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false);
  });

  it('exibe leg de caminhada com minutos e distância explícitos', () => {
    root = renderWithQuery(<PlannerResults results={mockResults} />, container);

    expect(container.textContent).toContain('Caminhe 5 min · 380 m');
  });

  it('exibe badge "Ao vivo" para legs com source=live', () => {
    root = renderWithQuery(<PlannerResults results={mockResults} />, container);

    expect(container.textContent).toContain('Ao vivo');
  });

  it('exibe badge "Histórico" para legs com source=historical', () => {
    root = renderWithQuery(<PlannerResults results={mockResults} />, container);

    expect(container.textContent).toContain('Histórico');
  });

  it('primeira alternativa é pré-selecionada visualmente', () => {
    root = renderWithQuery(<PlannerResults results={mockResults} />, container);

    const cards = container.querySelectorAll('[data-slot="card"]');
    expect(cards[0]?.getAttribute('data-selected')).toBe('true');
  });

  it('mostra no máximo 3 alternativas', () => {
    const manyAlternatives: PlannerRoutesResponse = {
      ...mockResults,
      alternatives: [
        ...mockResults.alternatives,
        { ...mockResults.alternatives[0], routeId: 'rota-3' },
        { ...mockResults.alternatives[0], routeId: 'rota-4' },
      ],
    };

    root = renderWithQuery(<PlannerResults results={manyAlternatives} />, container);

    const cards = container.querySelectorAll('[data-slot="card"]');
    expect(cards.length).toBeLessThanOrEqual(3);
  });

  it('exibe estado vazio quando alternatives é lista vazia', () => {
    const empty: PlannerRoutesResponse = { ...mockResults, alternatives: [] };

    root = renderWithQuery(<PlannerResults results={empty} />, container);

    expect(container.textContent).toContain('Nenhuma rota encontrada');
  });

  it('exibe botão "Comparar" nas alternativas não selecionadas', () => {
    root = renderWithQuery(<PlannerResults results={mockResults} />, container);

    expect(container.textContent).toContain('Comparar');
  });
});
