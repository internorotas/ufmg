/**
 * Custom Hook - Separation of Concerns para filtro de linhas.
 *
 * Este hook encapsula toda a lógica de estado e filtragem do MenuLateral,
 * permitindo que o componente foque apenas na renderização (JSX).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { getCurrentSpecialPeriod } from '../config/specialPeriods';
import type { CategoriaLinhas, DadosLinhas, Linha } from '../types/data.types';
import { useAnalytics } from './useAnalytics';

interface UseLinhasFilterOptions {
  debounceMs?: number;
  trackSearch?: boolean;
}

interface UseLinhasFilterReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearchTerm: string;

  categoriaAtiva: number;
  setCategoriaAtiva: (index: number) => void;
  categoriaAtual: DadosLinhas | undefined;

  linhasFiltradas: Linha[];
  hasResults: boolean;

  handleCategoriaChange: (index: number) => void;
}

/**
 * Determina a categoria inicial baseado no período atual e dia da semana.
 *
 * Regras:
 * - Se está em período de férias E é dia útil → aba "feriasRecessos"
 * - Se é sábado (e não está em período de férias) → aba "sabado"
 * - Caso contrário → aba "diasUteis" (padrão)
 */
function getInitialCategory(linhasData: CategoriaLinhas): number {
  const today = new Date().getDay();
  const isSaturday = today === 6;
  const isWeekday = today >= 1 && today <= 5;
  const specialPeriod = getCurrentSpecialPeriod();

  if (specialPeriod && isWeekday) {
    const feriasIndex = linhasData.categoriasDias.findIndex(
      (cat) => cat.categoriaDia === 'feriasRecessos',
    );
    return feriasIndex !== -1 ? feriasIndex : 0;
  }

  if (isSaturday && !specialPeriod) {
    const sabadoIndex = linhasData.categoriasDias.findIndex((cat) => cat.categoriaDia === 'sabado');
    return sabadoIndex !== -1 ? sabadoIndex : 0;
  }

  return 0;
}

/**
 * Filtra as linhas baseado no termo de busca.
 * Busca no nome, sublinha e descrição da linha.
 */
function filterLinhas(linhas: Linha[], searchTerm: string): Linha[] {
  if (!searchTerm.trim()) {
    return linhas;
  }

  const termLower = searchTerm.toLowerCase();

  return linhas.filter(
    (linha) =>
      linha.nome.toLowerCase().includes(termLower) ||
      linha.sublinha?.toLowerCase().includes(termLower) ||
      linha.descricao.toLowerCase().includes(termLower),
  );
}

/**
 * Hook customizado para gerenciar o filtro de linhas no MenuLateral.
 *
 * Encapsula:
 * - Estado de busca com debounce
 * - Estado de categoria ativa
 * - Lógica de filtragem
 * - Tracking de analytics
 *
 * @example
 * ```tsx
 * function MenuLateral({ linhasData }) {
 *   const {
 *     searchTerm,
 *     setSearchTerm,
 *     linhasFiltradas,
 *     handleCategoriaChange,
 *   } = useLinhasFilter(linhasData);
 *
 *   return (
 *     <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 *   );
 * }
 * ```
 */
export function useLinhasFilter(
  linhasData: CategoriaLinhas,
  options: UseLinhasFilterOptions = {},
): UseLinhasFilterReturn {
  const { debounceMs = 1500, trackSearch = true } = options;
  const { trackEvent, trackPageView } = useAnalytics();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, debounceMs);

  const [categoriaAtiva, setCategoriaAtiva] = useState<number>(() =>
    getInitialCategory(linhasData),
  );

  const categoriaAtual = useMemo(
    () => linhasData.categoriasDias[categoriaAtiva],
    [linhasData.categoriasDias, categoriaAtiva],
  );

  const todasLinhas = useMemo(() => {
    return linhasData.categoriasDias.flatMap((categoria) => categoria.linhas);
  }, [linhasData.categoriasDias]);

  const linhasFiltradas = useMemo(() => {
    return filterLinhas(todasLinhas, searchTerm);
  }, [todasLinhas, searchTerm]);

  const hasResults = linhasFiltradas.length > 0;

  useEffect(() => {
    if (trackSearch && debouncedSearchTerm) {
      trackEvent({
        event: 'search_term',
        category: 'engagement',
        action: 'search_term',
        label: debouncedSearchTerm,
      });
      trackPageView(`/search/${encodeURIComponent(debouncedSearchTerm)}`);
    }
  }, [debouncedSearchTerm, trackEvent, trackPageView, trackSearch]);

  useEffect(() => {
    if (trackSearch && searchTerm && linhasFiltradas.length === 0) {
      trackEvent({
        event: 'search_empty',
        category: 'engagement',
        action: 'search_empty',
        label: searchTerm,
      });
    }
  }, [searchTerm, linhasFiltradas.length, trackEvent, trackSearch]);

  const handleCategoriaChange = useCallback(
    (index: number) => {
      const categoria = linhasData.categoriasDias[index];
      if (categoria && trackSearch) {
        trackEvent({
          event: 'select_day_category',
          category: 'navigation',
          action: 'select_day_category',
          label: categoria.displayName,
        });
      }
      setCategoriaAtiva(index);
    },
    [linhasData.categoriasDias, trackEvent, trackSearch],
  );

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,

    categoriaAtiva,
    setCategoriaAtiva,
    categoriaAtual,

    linhasFiltradas,
    hasResults,

    handleCategoriaChange,
  };
}
