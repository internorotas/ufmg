/**
 * Custom Hook - Separation of Concerns para filtro de linhas.
 *
 * Este hook encapsula toda a lógica de estado e filtragem do MenuLateral,
 * permitindo que o componente foque apenas na renderização (JSX).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { getCurrentSpecialPeriod } from '../config/specialPeriods';
import { getSaoPauloDayOfWeek, getSaoPauloNow } from '../lib/time';
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
 * - Se está em período de férias → aba "feriasRecessos"
 * - Se é sábado → aba "sabado"
 * - Caso contrário → aba "diasUteis" (padrão)
 *
 * Prioridade: férias > sábado > dias úteis
 */
function findCategoryIndex(
  categorias: CategoriaLinhas['categoriasDias'],
  aliases: string[],
): number {
  if (categorias.length === 0) return -1;

  return categorias.findIndex((cat) =>
    aliases.some((alias) => cat.categoriaDia.toLowerCase() === alias.toLowerCase()),
  );
}

function getInitialCategory(linhasData: CategoriaLinhas): number {
  if (!linhasData.categoriasDias.length) return 0;

  const today = getSaoPauloDayOfWeek(getSaoPauloNow());
  const isSaturday = today === 6;
  const isWeekday = today >= 1 && today <= 5;
  const isInVacationPeriod = getCurrentSpecialPeriod() !== null;

  const vacationIndex = findCategoryIndex(linhasData.categoriasDias, [
    'feriasRecessos',
    'vacation',
  ]);
  const saturdayIndex = findCategoryIndex(linhasData.categoriasDias, ['sabado', 'saturday']);
  const weekdaysIndex = findCategoryIndex(linhasData.categoriasDias, ['diasUteis', 'weekdays']);

  // Borda: dia inválido/misconfigurado
  if (!Number.isInteger(today) || today < 0 || today > 6) {
    if (weekdaysIndex !== -1) return weekdaysIndex;
    return 0;
  }

  if (isInVacationPeriod && vacationIndex !== -1) {
    return vacationIndex;
  }

  if (isSaturday && saturdayIndex !== -1) {
    return saturdayIndex;
  }

  if (isWeekday && weekdaysIndex !== -1) {
    return weekdaysIndex;
  }

  if (weekdaysIndex !== -1) return weekdaysIndex;
  if (saturdayIndex !== -1) return saturdayIndex;
  if (vacationIndex !== -1) return vacationIndex;

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

  useEffect(() => {
    if (!linhasData.categoriasDias.length) {
      if (categoriaAtiva !== 0) {
        setCategoriaAtiva(0);
      }
      return;
    }

    if (categoriaAtiva < 0 || categoriaAtiva >= linhasData.categoriasDias.length) {
      setCategoriaAtiva(getInitialCategory(linhasData));
    }
  }, [linhasData, categoriaAtiva]);

  const categoriaAtual = useMemo(
    () => linhasData.categoriasDias[categoriaAtiva],
    [linhasData.categoriasDias, categoriaAtiva],
  );

  const linhasDaCategoriaAtiva = useMemo(() => categoriaAtual?.linhas ?? [], [categoriaAtual]);

  const linhasFiltradas = useMemo(() => {
    return filterLinhas(linhasDaCategoriaAtiva, searchTerm);
  }, [linhasDaCategoriaAtiva, searchTerm]);

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
      if (index < 0 || index >= linhasData.categoriasDias.length || index === categoriaAtiva) {
        return;
      }

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
    [categoriaAtiva, linhasData.categoriasDias, trackEvent, trackSearch],
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
