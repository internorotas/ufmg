/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CategoriaLinhas } from '@/types/data.types';
import { useFavoritos } from './useFavoritos';

const mockTrackEvent = vi.fn();

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
  }),
}));

vi.mock('@/contexts/RotasContext', () => ({
  useRotasData: () => ({
    rotasService: {
      getLinhaById: vi.fn((idRota: string) => ({
        idRota,
        nome: `Linha ${idRota}`,
      })),
    },
    linhasData: { categoriasDias: [] },
    todasParadas: [],
    isLoadingData: false,
    dataError: null,
  }),
}));

const categoriasMock: CategoriaLinhas = {
  categoriasDias: [
    {
      id: 1,
      categoriaDia: 'diasUteis',
      displayName: 'Dias Uteis',
      linhas: [
        {
          idRota: 'rota-1',
          linha: 5101,
          nome: 'Circular Principal',
          tipo: 'circular',
          sublinha: null,
          categoriaDia: 'diasUteis',
          corHex: '#0f766e',
          descricao: 'Circuito principal do campus',
          horarios: [],
          itinerarioParadasIds: [],
          coordenadasTrajeto: [],
        },
        {
          idRota: 'rota-2',
          linha: 5102,
          nome: 'Expressa Biblioteca',
          tipo: 'expressa',
          sublinha: 'Circular Noturno',
          categoriaDia: 'diasUteis',
          corHex: '#1d4ed8',
          descricao: 'Linha rápida para biblioteca',
          horarios: [],
          itinerarioParadasIds: [],
          coordenadasTrajeto: [],
        },
      ],
    },
    {
      id: 2,
      categoriaDia: 'sabado',
      displayName: 'Sabado',
      linhas: [
        {
          idRota: 'rota-3',
          linha: 5201,
          nome: 'Circular Sabado',
          tipo: 'circular',
          sublinha: null,
          categoriaDia: 'sabado',
          corHex: '#dc2626',
          descricao: 'Linha de fim de semana',
          horarios: [],
          itinerarioParadasIds: [],
          coordenadasTrajeto: [],
        },
      ],
    },
  ],
};

describe('useFavoritos', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockTrackEvent.mockReset();
  });

  it('adiciona favorito e persiste em favoritos_v1', () => {
    const { result } = renderHook(() => useFavoritos());

    act(() => {
      result.current.toggleFavorito('rota-1', 'Circular Principal');
    });

    expect(result.current.isFavorito('rota-1')).toBe(true);
    expect(window.localStorage.getItem('favoritos_v1')).toBe('["rota-1"]');
  });

  it('toggle em item existente remove favorito', () => {
    const { result } = renderHook(() => useFavoritos());

    act(() => {
      result.current.toggleFavorito('rota-1', 'Circular Principal');
      result.current.toggleFavorito('rota-1', 'Circular Principal');
    });

    expect(result.current.isFavorito('rota-1')).toBe(false);
    expect(window.localStorage.getItem('favoritos_v1')).toBe('[]');
  });

  it('hidrata favoritos a partir do localStorage ao montar', () => {
    window.localStorage.setItem('favoritos_v1', JSON.stringify(['rota-x']));

    const { result } = renderHook(() => useFavoritos());

    expect(result.current.isFavorito('rota-x')).toBe(true);
  });

  it('buscarEmFavoritas filtra por categoria e termo', () => {
    const { result } = renderHook(() => useFavoritos());

    act(() => {
      result.current.toggleFavorito('rota-1', 'Circular Principal');
      result.current.toggleFavorito('rota-3', 'Circular Sabado');
    });

    const found = result.current.buscarEmFavoritas(categoriasMock, 'circular', 'diasUteis');

    expect(found).toHaveLength(1);
    expect(found[0]?.idRota).toBe('rota-1');
  });

  it('sincroniza estado com evento storage entre abas', () => {
    const { result } = renderHook(() => useFavoritos());

    act(() => {
      window.localStorage.setItem('favoritos_v1', JSON.stringify(['rota-y']));
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'favoritos_v1',
          newValue: JSON.stringify(['rota-y']),
        }),
      );
    });

    expect(result.current.isFavorito('rota-y')).toBe(true);
  });

  it('compartilha atualizações ao vivo entre múltiplos hooks sem recarregar', () => {
    const hookA = renderHook(() => useFavoritos());
    const hookB = renderHook(() => useFavoritos());

    act(() => {
      hookA.result.current.toggleFavorito('rota-live', 'Linha Live');
    });

    expect(hookA.result.current.isFavorito('rota-live')).toBe(true);
    expect(hookB.result.current.isFavorito('rota-live')).toBe(true);

    act(() => {
      hookB.result.current.toggleFavorito('rota-live', 'Linha Live');
    });

    expect(hookA.result.current.isFavorito('rota-live')).toBe(false);
    expect(hookB.result.current.isFavorito('rota-live')).toBe(false);
  });
});
