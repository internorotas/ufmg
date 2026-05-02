import { useCallback, useEffect } from 'react';
import { useRotasData } from '@/contexts/RotasContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { retainFavoritosStorageListener, useFavoritosStore } from '@/stores/favoritosStore';
import type { CategoriaLinhas, Linha } from '@/types/data.types';

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
  const favoritosIds = useFavoritosStore((s) => s.ids);
  const syncFromStorage = useFavoritosStore((s) => s.syncFromStorage);
  const toggle = useFavoritosStore((s) => s.toggle);

  useEffect(() => {
    syncFromStorage();
    return retainFavoritosStorageListener();
  }, [syncFromStorage]);

  const isFavorito = useCallback((idRota: string) => favoritosIds.includes(idRota), [favoritosIds]);

  const toggleFavorito = useCallback(
    (idRota: string, nomeLinha: string) => {
      const linhaNome = rotasService.getLinhaById(idRota)?.nome ?? nomeLinha;
      const { next, isNowFav } = toggle(idRota);
      trackEvent(
        {
          category: 'preferences',
          action: isNowFav ? 'favorite_added' : 'favorite_removed',
          label: linhaNome,
        },
        { linha_id: idRota, linha_nome: linhaNome, total_after: next.length },
      );
    },
    [rotasService, toggle, trackEvent],
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
