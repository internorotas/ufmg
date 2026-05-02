// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFavoritos } from '@/hooks/useFavoritos';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({ trackEvent: vi.fn() }),
}));

vi.mock('@/contexts/RotasContext', () => ({
  useRotasData: () => ({
    rotasService: { getLinhaById: (_id: string) => null },
    linhasData: { categoriasDias: [] },
    todasParadas: [],
    isLoadingData: false,
    dataError: null,
  }),
}));

describe('useFavoritos', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('Caso 1: adiciona favorito e persiste em localStorage', () => {
    const { result } = renderHook(() => useFavoritos());

    act(() => {
      result.current.toggleFavorito('rota-1', 'Linha 1');
    });

    expect(result.current.isFavorito('rota-1')).toBe(true);
    expect(window.localStorage.getItem('favoritos_v1')).toBe(JSON.stringify(['rota-1']));
  });

  it('Caso 2: toggleFavorito duas vezes remove o favorito', () => {
    const { result } = renderHook(() => useFavoritos());

    act(() => {
      result.current.toggleFavorito('rota-1', 'Linha 1');
      result.current.toggleFavorito('rota-1', 'Linha 1');
    });

    expect(result.current.isFavorito('rota-1')).toBe(false);
    expect(window.localStorage.getItem('favoritos_v1')).toBe(JSON.stringify([]));
  });

  it('Caso 3: reconstitui estado do localStorage na montagem', () => {
    window.localStorage.setItem('favoritos_v1', JSON.stringify(['rota-x']));

    const { result } = renderHook(() => useFavoritos());

    expect(result.current.isFavorito('rota-x')).toBe(true);
  });

  it('Caso 4: buscarEmFavoritas filtra por categoria e termo', () => {
    const { result } = renderHook(() => useFavoritos());

    const linhasData = {
      categoriasDias: [
        {
          id: 1,
          categoriaDia: 'diasUteis',
          displayName: 'Dias Úteis',
          linhas: [
            {
              idRota: 'rota-1',
              linha: 101,
              nome: 'Circular Pampulha',
              tipo: 'interno',
              sublinha: null,
              categoriaDia: 'diasUteis',
              corHex: '#FF0000',
              descricao: 'Linha circular',
              horarios: [],
              itinerarioParadasIds: [],
              coordenadasTrajeto: [],
            },
            {
              idRota: 'rota-2',
              linha: 102,
              nome: 'Expressa Campus',
              tipo: 'interno',
              sublinha: null,
              categoriaDia: 'diasUteis',
              corHex: '#00FF00',
              descricao: 'Linha expressa',
              horarios: [],
              itinerarioParadasIds: [],
              coordenadasTrajeto: [],
            },
          ],
        },
        {
          id: 2,
          categoriaDia: 'sabado',
          displayName: 'Sábado',
          linhas: [
            {
              idRota: 'rota-3',
              linha: 201,
              nome: 'Circular Sábado',
              tipo: 'interno',
              sublinha: null,
              categoriaDia: 'sabado',
              corHex: '#0000FF',
              descricao: 'Linha sabado',
              horarios: [],
              itinerarioParadasIds: [],
              coordenadasTrajeto: [],
            },
          ],
        },
      ],
    };

    act(() => {
      result.current.toggleFavorito('rota-1', 'Circular Pampulha');
      result.current.toggleFavorito('rota-3', 'Circular Sábado');
    });

    const favoritas = result.current.buscarEmFavoritas(linhasData, 'circular', 'diasUteis');
    expect(favoritas).toHaveLength(1);
    expect(favoritas[0]?.idRota).toBe('rota-1');
  });

  it('Caso 5: evento storage sincroniza estado entre abas', () => {
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
});
