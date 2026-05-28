import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { CategoriaLinhas, Linha } from '@/types/data.types';

const STORAGE_KEY = 'favoritos_v1';

function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const onlyStrings = value.filter((item): item is string => typeof item === 'string');
  return Array.from(new Set(onlyStrings));
}

function readFromStorage(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return normalizeIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeToStorage(ids: string[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function areArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }

  return true;
}

let favoritosCache = readFromStorage();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): string[] {
  return favoritosCache;
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function setFavoritosCache(next: string[]): void {
  if (areArraysEqual(favoritosCache, next)) {
    return;
  }

  favoritosCache = next;
  writeToStorage(next);
  notifyListeners();
}

export interface UseFavoritosReturn {
  favoritosIds: string[];
  isFavorito: (idRota: string) => boolean;
  toggleFavorito: (idRota: string, nomeLinha?: string) => void;
  getLinhasFavoritas: (linhasData: CategoriaLinhas, categoriaDia: string) => Linha[];
  buscarEmFavoritas: (linhasData: CategoriaLinhas, termo: string, categoriaDia: string) => Linha[];
}

export function useFavoritos(): UseFavoritosReturn {
  const { trackEvent } = useAnalytics();
  const favoritosIds = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    const storageSnapshot = readFromStorage();
    if (!areArraysEqual(favoritosCache, storageSnapshot)) {
      favoritosCache = storageSnapshot;
      notifyListeners();
    }

    const syncFromStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) {
        return;
      }

      const next = readFromStorage();
      if (areArraysEqual(favoritosCache, next)) {
        return;
      }

      favoritosCache = next;
      notifyListeners();
    };

    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  const isFavorito = useCallback((idRota: string) => favoritosIds.includes(idRota), [favoritosIds]);

  const toggleFavorito = useCallback(
    (idRota: string, nomeLinha?: string) => {
      const currentlyFavorite = favoritosCache.includes(idRota);
      const next = currentlyFavorite
        ? favoritosCache.filter((itemId) => itemId !== idRota)
        : [...favoritosCache, idRota];

      setFavoritosCache(next);

      const resolvedName = nomeLinha ?? idRota;

      trackEvent(
        {
          category: 'preferences',
          action: currentlyFavorite ? 'favorite_removed' : 'favorite_added',
          label: resolvedName,
        },
        {
          linha_id: idRota,
          linha_nome: resolvedName,
          total_after: next.length,
        },
      );
    },
    [trackEvent],
  );

  const getLinhasFavoritas = useCallback(
    (linhasData: CategoriaLinhas, categoriaDia: string): Linha[] => {
      const categoria = linhasData.categoriasDias.find(
        (item) => item.categoriaDia === categoriaDia,
      );
      if (!categoria) {
        return [];
      }

      return categoria.linhas.filter((linha) => favoritosIds.includes(linha.idRota));
    },
    [favoritosIds],
  );

  const buscarEmFavoritas = useCallback(
    (linhasData: CategoriaLinhas, termo: string, categoriaDia: string): Linha[] => {
      const favoritas = getLinhasFavoritas(linhasData, categoriaDia);
      const normalizedTerm = termo.trim().toLowerCase();

      if (!normalizedTerm) {
        return favoritas;
      }

      return favoritas.filter(
        (linha) =>
          linha.nome.toLowerCase().includes(normalizedTerm) ||
          linha.sublinha?.toLowerCase().includes(normalizedTerm) ||
          linha.descricao.toLowerCase().includes(normalizedTerm),
      );
    },
    [getLinhasFavoritas],
  );

  return {
    favoritosIds,
    isFavorito,
    toggleFavorito,
    getLinhasFavoritas,
    buscarEmFavoritas,
  };
}
