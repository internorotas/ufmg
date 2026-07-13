import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { type UserProfile, updateProfile } from '@/features/profile/api/profileClient';
import { PROFILE_QUERY_KEY, useProfileQuery } from '@/features/profile/queries/useProfileQuery';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { Parada } from '@/types/data.types';

// ── localStorage store (unauthenticated fallback) ───────────────────────────

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

function areArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

let localCache = readFromStorage();
const localListeners = new Set<() => void>();

function localSubscribe(listener: () => void) {
  localListeners.add(listener);
  return () => localListeners.delete(listener);
}

function localSnapshot() {
  return localCache;
}

function setLocalCache(next: string[]): void {
  if (areArraysEqual(localCache, next)) return;
  localCache = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  for (const fn of localListeners) fn();
}

// ── hook ────────────────────────────────────────────────────────────────────

export interface UseParadasFavoritasReturn {
  favoritasIds: string[];
  isFavorita: (idParada: string) => boolean;
  toggleFavorita: (idParada: string, nomeParada?: string) => void;
  getParadasFavoritas: (todasParadas: Parada[]) => Parada[];
}

export function useParadasFavoritas(): UseParadasFavoritasReturn {
  const { isAuthenticated } = useAuthContext();
  const { data: profile } = useProfileQuery();
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();
  const localIds = useSyncExternalStore(localSubscribe, localSnapshot, localSnapshot);

  useEffect(() => {
    if (!isAuthenticated) {
      const snapshot = readFromStorage();
      if (!areArraysEqual(localCache, snapshot)) {
        localCache = snapshot;
        for (const fn of localListeners) fn();
      }
      const sync = (e: StorageEvent) => {
        if (e.key !== STORAGE_KEY && e.key !== null) return;
        const next = readFromStorage();
        if (!areArraysEqual(localCache, next)) setLocalCache(next);
      };
      window.addEventListener('storage', sync);
      return () => window.removeEventListener('storage', sync);
    }
  }, [isAuthenticated]);

  const favoritasIds = isAuthenticated ? (profile?.favoriteStopIds ?? []) : localIds;

  const isFavorita = useCallback(
    (idParada: string) => favoritasIds.includes(idParada),
    [favoritasIds],
  );

  const toggleFavorita = useCallback(
    (idParada: string, nomeParada?: string) => {
      const currentlyFavorite = favoritasIds.includes(idParada);
      const newIds = currentlyFavorite
        ? favoritasIds.filter((id) => id !== idParada)
        : [...favoritasIds, idParada];

      if (isAuthenticated) {
        queryClient.setQueryData<UserProfile>(PROFILE_QUERY_KEY, (prev) =>
          prev ? { ...prev, favoriteStopIds: newIds } : prev,
        );
        void updateProfile({ favoriteStopIds: newIds }).catch(() => {
          queryClient.setQueryData<UserProfile>(PROFILE_QUERY_KEY, (prev) =>
            prev ? { ...prev, favoriteStopIds: favoritasIds } : prev,
          );
        });
      } else {
        setLocalCache(newIds);
      }

      trackEvent({
        category: 'preferences',
        action: currentlyFavorite ? 'parada_favorite_removed' : 'parada_favorite_added',
        label: nomeParada ?? idParada,
      });
    },
    [favoritasIds, isAuthenticated, queryClient, trackEvent],
  );

  const getParadasFavoritas = useCallback(
    (todasParadas: Parada[]) => todasParadas.filter((p) => favoritasIds.includes(p.idParada)),
    [favoritasIds],
  );

  return { favoritasIds, isFavorita, toggleFavorita, getParadasFavoritas };
}
