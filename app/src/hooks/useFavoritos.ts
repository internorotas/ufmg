import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { type UserProfile, updateProfile } from '@/features/profile/api/profileClient';
import { PROFILE_QUERY_KEY, useProfileQuery } from '@/features/profile/queries/useProfileQuery';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { CategoriaLinhas, Linha } from '@/types/data.types';

// ── localStorage store (unauthenticated fallback) ───────────────────────────

const STORAGE_KEY = 'favoritos_v1';

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

export interface UseFavoritosReturn {
  favoritosIds: string[];
  isFavorito: (idRota: string) => boolean;
  toggleFavorito: (idRota: string, nomeLinha?: string) => void;
  getLinhasFavoritas: (linhasData: CategoriaLinhas, categoriaDia: string) => Linha[];
  buscarEmFavoritas: (linhasData: CategoriaLinhas, termo: string, categoriaDia: string) => Linha[];
}

export function useFavoritos(): UseFavoritosReturn {
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

  const favoritosIds = isAuthenticated ? (profile?.favoriteLineIds ?? []) : localIds;

  const isFavorito = useCallback((idRota: string) => favoritosIds.includes(idRota), [favoritosIds]);

  const toggleFavorito = useCallback(
    (idRota: string, nomeLinha?: string) => {
      const currentlyFavorite = favoritosIds.includes(idRota);
      const newIds = currentlyFavorite
        ? favoritosIds.filter((id) => id !== idRota)
        : [...favoritosIds, idRota];

      if (isAuthenticated) {
        queryClient.setQueryData<UserProfile>(PROFILE_QUERY_KEY, (prev) =>
          prev ? { ...prev, favoriteLineIds: newIds } : prev,
        );
        void updateProfile({ favoriteLineIds: newIds }).catch(() => {
          queryClient.setQueryData<UserProfile>(PROFILE_QUERY_KEY, (prev) =>
            prev ? { ...prev, favoriteLineIds: favoritosIds } : prev,
          );
        });
      } else {
        setLocalCache(newIds);
      }

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
          total_after: newIds.length,
        },
      );
    },
    [favoritosIds, isAuthenticated, queryClient, trackEvent],
  );

  const getLinhasFavoritas = useCallback(
    (linhasData: CategoriaLinhas, categoriaDia: string): Linha[] => {
      const categoria = linhasData.categoriasDias.find(
        (item) => item.categoriaDia === categoriaDia,
      );
      if (!categoria) return [];
      return categoria.linhas.filter((linha) => favoritosIds.includes(linha.idRota));
    },
    [favoritosIds],
  );

  const buscarEmFavoritas = useCallback(
    (linhasData: CategoriaLinhas, termo: string, categoriaDia: string): Linha[] => {
      const favoritas = getLinhasFavoritas(linhasData, categoriaDia);
      const normalizedTerm = termo.trim().toLowerCase();
      if (!normalizedTerm) return favoritas;
      return favoritas.filter(
        (linha) =>
          linha.nome.toLowerCase().includes(normalizedTerm) ||
          linha.sublinha?.toLowerCase().includes(normalizedTerm) ||
          linha.descricao.toLowerCase().includes(normalizedTerm),
      );
    },
    [getLinhasFavoritas],
  );

  return { favoritosIds, isFavorito, toggleFavorito, getLinhasFavoritas, buscarEmFavoritas };
}
