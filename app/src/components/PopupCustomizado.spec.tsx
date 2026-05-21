// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlannerStore } from '@/features/planner/store/plannerStore';

// Mock mínimo do react-leaflet Popup para evitar dependência do Leaflet em JSDOM
vi.mock('react-leaflet', () => ({
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock do NotificacaoContext
vi.mock('@/contexts/NotificacaoContext', () => ({
  useNotificacaoContext: () => ({
    suportado: false,
    isAlarmado: () => false,
    toggleNotificacao: vi.fn(),
  }),
}));

// Mock do RotasContext / useRotasData / useRotasSelection
vi.mock('@/contexts/RotasContext', () => ({
  useRotasData: () => ({
    rotasService: {
      getLinhasPorNomeNormalizado: () => [],
      getTodasParadas: () => [],
    },
    todasParadas: [],
  }),
  useRotasSelection: () => ({
    selecionarLinha: vi.fn(),
    selecionarParada: vi.fn(),
    limparSelecao: vi.fn(),
    linhaSelecionada: null,
    paradaSelecionada: null,
  }),
}));

// Mock do useAnalytics
vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: vi.fn(),
  }),
}));

// Mock do useCurrentTime
vi.mock('@/hooks/useCurrentTime', () => ({
  useCurrentTime: () => new Date('2026-05-13T10:00:00.000Z'),
}));

// Mock de calcularPrevisaoChegada
vi.mock('@/features/eta/domain/calculateEta', () => ({
  calcularPrevisaoChegada: () => null,
}));

// eslint-disable-next-line import/first
import { PopupCustomizado } from './PopupCustomizado';

const paradaMock = {
  idParada: 'parada-xyz',
  nome: 'Parada Teste',
  categoria: 'Categoria A',
  descricao: '',
  coordenadas: [-19.87, -43.97] as [number, number],
  linhasAtendidas: [],
};

describe('PopupCustomizado — ações do planejador', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
    usePlannerStore.getState().reset();

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    usePlannerStore.getState().reset();
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false);
  });

  it('renderiza botão "Usar como origem"', async () => {
    await act(async () => {
      root.render(<PopupCustomizado parada={paradaMock} />);
    });

    expect(container.textContent).toContain('Usar como origem');
  });

  it('renderiza botão "Usar como destino"', async () => {
    await act(async () => {
      root.render(<PopupCustomizado parada={paradaMock} />);
    });

    expect(container.textContent).toContain('Usar como destino');
  });

  it('clicar em "Usar como origem" define a parada como origin no store', async () => {
    await act(async () => {
      root.render(<PopupCustomizado parada={paradaMock} />);
    });

    const btn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Usar como origem'),
    );

    expect(btn).not.toBeNull();

    await act(async () => {
      btn?.click();
    });

    const state = usePlannerStore.getState();
    expect(state.origin).toEqual({
      kind: 'stop',
      idParada: 'parada-xyz',
      nome: 'Parada Teste',
    });
  });

  it('clicar em "Usar como destino" define a parada como destination no store', async () => {
    await act(async () => {
      root.render(<PopupCustomizado parada={paradaMock} />);
    });

    const btn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Usar como destino'),
    );

    expect(btn).not.toBeNull();

    await act(async () => {
      btn?.click();
    });

    const state = usePlannerStore.getState();
    expect(state.destination).toEqual({
      kind: 'stop',
      idParada: 'parada-xyz',
      nome: 'Parada Teste',
    });
  });
});
