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

/**
 * Configurações do hook de filtro
 */
interface UseLinhasFilterOptions {
  /** Tempo de debounce para a busca em ms (padrão: 1500) */
  debounceMs?: number;
  /** Se deve rastrear eventos de busca no Analytics */
  trackSearch?: boolean;
}

/**
 * Retorno do hook de filtro de linhas
 */
interface UseLinhasFilterReturn {
  // Estado de busca
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearchTerm: string;

  // Estado de categoria
  categoriaAtiva: number;
  setCategoriaAtiva: (index: number) => void;
  categoriaAtual: DadosLinhas | undefined;

  // Linhas filtradas
  linhasFiltradas: Linha[];
  hasResults: boolean;

  // Handler para mudança de categoria com tracking
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
  const today = new Date().getDay(); // 0 = domingo, 6 = sábado
  const isSaturday = today === 6;
  const isWeekday = today >= 1 && today <= 5;
  const specialPeriod = getCurrentSpecialPeriod();

  // Se está em período de férias E é dia útil → mostrar aba de férias
  if (specialPeriod && isWeekday) {
    const feriasIndex = linhasData.categoriasDias.findIndex(
      (cat) => cat.categoriaDia === 'feriasRecessos',
    );
    return feriasIndex !== -1 ? feriasIndex : 0;
  }

  // Se é sábado (e não está em período de férias) → mostrar aba de sábado
  if (isSaturday && !specialPeriod) {
    const sabadoIndex = linhasData.categoriasDias.findIndex((cat) => cat.categoriaDia === 'sabado');
    return sabadoIndex !== -1 ? sabadoIndex : 0;
  }

  // Padrão: dias úteis (índice 0)
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
      (linha.sublinha && linha.sublinha.toLowerCase().includes(termLower)) ||
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
 *     // ...resto do JSX
 *   );
 * }
 * ```
 */
export function useLinhasFilter(
  linhasData: CategoriaLinhas,
  options: UseLinhasFilterOptions = {},
): UseLinhasFilterReturn {
  const { debounceMs = 1500, trackSearch = true } = options;
  const { trackEvent } = useAnalytics();

  // Estado de busca
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, debounceMs);

  // Estado de categoria (inicializa baseado em período especial)
  const [categoriaAtiva, setCategoriaAtiva] = useState<number>(() =>
    getInitialCategory(linhasData),
  );

  // Categoria atual memoizada
  const categoriaAtual = useMemo(
    () => linhasData.categoriasDias[categoriaAtiva],
    [linhasData.categoriasDias, categoriaAtiva],
  );

  // Linhas filtradas memoizadas
  const linhasFiltradas = useMemo(() => {
    const linhasDaCategoria = categoriaAtual?.linhas || [];
    return filterLinhas(linhasDaCategoria, searchTerm);
  }, [categoriaAtual?.linhas, searchTerm]);

  // Flag de resultados
  const hasResults = linhasFiltradas.length > 0;

  // Tracking: Termo de busca (debounced)
  useEffect(() => {
    if (trackSearch && debouncedSearchTerm) {
      trackEvent({
        category: 'Busca',
        action: 'Termo Pesquisado',
        label: debouncedSearchTerm,
      });
    }
  }, [debouncedSearchTerm, trackEvent, trackSearch]);

  // Tracking: Busca sem resultados
  useEffect(() => {
    if (trackSearch && searchTerm && !hasResults) {
      trackEvent({
        category: 'Busca',
        action: 'Busca Sem Resultados',
        label: searchTerm,
      });
    }
  }, [searchTerm, hasResults, trackEvent, trackSearch]);

  // Handler para mudança de categoria com tracking
  const handleCategoriaChange = useCallback(
    (index: number) => {
      const categoria = linhasData.categoriasDias[index];
      if (categoria && trackSearch) {
        trackEvent({
          category: 'Navegação Principal',
          action: 'Selecionar Categoria Dia',
          label: categoria.displayName,
        });
      }
      setCategoriaAtiva(index);
    },
    [linhasData.categoriasDias, trackEvent, trackSearch],
  );

  return {
    // Busca
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,

    // Categoria
    categoriaAtiva,
    setCategoriaAtiva,
    categoriaAtual,

    // Resultados
    linhasFiltradas,
    hasResults,

    // Handlers
    handleCategoriaChange,
  };
}
