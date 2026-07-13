import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { Parada } from '@/types/data.types';

const STORAGE_KEY = 'favoritas_paradas_v1';

function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string')));
}

function readFromStorage(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeToStorage(ids: string[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function areArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

let paradasFavoritasCache = readFromStorage();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): string[] {
  return paradasFavoritasCache;
}

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

function setParadasFavoritasCache(next: string[]): void {
  if (areArraysEqual(paradasFavoritasCache, next)) return;
  paradasFavoritasCache = next;
  writeToStorage(next);
  notifyListeners();
}

export interface UseParadasFavoritasReturn {
  favoritasIds: string[];
  isFavorita: (idParada: string) => boolean;
  toggleFavorita: (idParada: string, nomeParada?: string) => void;
  getParadasFavoritas: (todasParadas: Parada[]) => Parada[];
}

export function useParadasFavoritas(): UseParadasFavoritasReturn {
  const { trackEvent } = useAnalytics();
  const favoritasIds = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    const storageSnapshot = readFromStorage();
    if (!areArraysEqual(paradasFavoritasCache, storageSnapshot)) {
      paradasFavoritasCache = storageSnapshot;
      notifyListeners();
    }

    const syncFromStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const next = readFromStorage();
      if (areArraysEqual(paradasFavoritasCache, next)) return;
      paradasFavoritasCache = next;
      notifyListeners();
    };

    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  const isFavorita = useCallback(
    (idParada: string) => favoritasIds.includes(idParada),
    [favoritasIds],
  );

  const toggleFavorita = useCallback(
    (idParada: string, nomeParada?: string) => {
      const currentlyFavorite = paradasFavoritasCache.includes(idParada);
      const next = currentlyFavorite
        ? paradasFavoritasCache.filter((id) => id !== idParada)
        : [...paradasFavoritasCache, idParada];

      setParadasFavoritasCache(next);

      trackEvent({
        category: 'preferences',
        action: currentlyFavorite ? 'parada_favorite_removed' : 'parada_favorite_added',
        label: nomeParada ?? idParada,
      });
    },
    [trackEvent],
  );

  const getParadasFavoritas = useCallback(
    (todasParadas: Parada[]) => todasParadas.filter((p) => favoritasIds.includes(p.idParada)),
    [favoritasIds],
  );

  return { favoritasIds, isFavorita, toggleFavorita, getParadasFavoritas };
}
