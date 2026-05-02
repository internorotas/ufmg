import { useCallback, useEffect, useState } from 'react';
import { useRotasData } from '@/contexts/RotasContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { CategoriaLinhas, Linha } from '@/types/data.types';

const STORAGE_KEY = 'favoritos_v1';

function readFromStorage(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeToStorage(ids: string[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export interface UseFavoritosReturn {
  favoritosIds: string[];
  isFavorito: (idRota: string) => boolean;
  toggleFavorito: (idRota: string, nomeLinha: string) => void;
  getLinhasFavoritas: (linhasData: CategoriaLinhas, categoriaDia: string) => Linha[];
  buscarEmFavoritas: (linhasData: CategoriaLinhas, termo: string, categoriaDia: string) => Linha[];
}

export function useFavoritos(): UseFavoritosReturn {
  const { rotasService } = useRotasData();
  const { trackEvent } = useAnalytics();
  const [favoritosIds, setFavoritosIds] = useState<string[]>(readFromStorage);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setFavoritosIds(readFromStorage());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const isFavorito = useCallback((idRota: string) => favoritosIds.includes(idRota), [favoritosIds]);

  const toggleFavorito = useCallback(
    (idRota: string, nomeLinha: string) => {
      const linhaNome = rotasService.getLinhaById(idRota)?.nome ?? nomeLinha;
      setFavoritosIds((prev) => {
        const isCurrentlyFav = prev.includes(idRota);
        const next = isCurrentlyFav ? prev.filter((id) => id !== idRota) : [...prev, idRota];
        writeToStorage(next);
        trackEvent(
          {
            category: 'preferences',
            action: isCurrentlyFav ? 'favorite_removed' : 'favorite_added',
            label: linhaNome,
          },
          { linha_id: idRota, linha_nome: linhaNome, total_after: next.length },
        );
        return next;
      });
    },
    [rotasService, trackEvent],
  );

  const getLinhasFavoritas = useCallback(
    (linhasData: CategoriaLinhas, categoriaDia: string): Linha[] => {
      const categoria = linhasData.categoriasDias.find((c) => c.categoriaDia === categoriaDia);
      if (!categoria) return [];
      return categoria.linhas.filter((linha) => favoritosIds.includes(linha.idRota));
    },
    [favoritosIds],
  );

  const buscarEmFavoritas = useCallback(
    (linhasData: CategoriaLinhas, termo: string, categoriaDia: string): Linha[] => {
      const favoritas = getLinhasFavoritas(linhasData, categoriaDia);
      if (!termo.trim()) return favoritas;
      const termLower = termo.toLowerCase();
      return favoritas.filter(
        (linha) =>
          linha.nome.toLowerCase().includes(termLower) ||
          linha.sublinha?.toLowerCase().includes(termLower) ||
          linha.descricao.toLowerCase().includes(termLower),
      );
    },
    [getLinhasFavoritas],
  );

  return { favoritosIds, isFavorito, toggleFavorito, getLinhasFavoritas, buscarEmFavoritas };
}
