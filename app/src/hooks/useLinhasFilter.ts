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
import { converterHoraParaMinutos, obterHorariosLinhaNoDia, obterStatusLinha } from '../lib/utils';
import type { CategoriaLinhas, DadosLinhas, Linha } from '../types/data.types';
import { useAnalytics } from './useAnalytics';
import { useCurrentTime } from './useCurrentTime';

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
 * Retorna o grupo de ordenação da linha baseado no status atual:
 *   0 → ativa (circulando ou aguardando 1ª saída)
 *   1 → encerrada (ultimo horário já passou)
 *   2 → não circula hoje
 */
function getStatusGroup(linha: Linha, agora: Date): number {
  const { id } = obterStatusLinha(linha, agora);
  if (id === 'ENCERRADA') return 1;
  if (id === 'NAO_CIRCULA_HOJE') return 2;
  return 0;
}

function getUltimoHorarioMinutos(linha: Linha, agora: Date): number {
  const minutos = obterHorariosLinhaNoDia(linha, agora)
    .map(converterHoraParaMinutos)
    .filter(Number.isFinite);
  return minutos.length > 0 ? Math.max(...minutos) : 0;
}

/**
 * Ordena as linhas por estado operacional:
 *  1. Ativas (circulando / aguardando) → ordem crescente pelo número da linha
 *  2. Encerradas → ordem decrescente pelo último horário (passou por último = topo)
 *  3. Não circulam hoje → ordem crescente pelo número da linha
 */
function sortLinhas(linhas: Linha[], agora: Date): Linha[] {
  return [...linhas].sort((a, b) => {
    const groupA = getStatusGroup(a, agora);
    const groupB = getStatusGroup(b, agora);

    if (groupA !== groupB) return groupA - groupB;

    // Encerradas: mais recentemente encerrada fica no topo (último horário desc)
    if (groupA === 1) {
      return getUltimoHorarioMinutos(b, agora) - getUltimoHorarioMinutos(a, agora);
    }

    // Ativas e não-circulam-hoje: por número da linha crescente
    return a.linha - b.linha;
  });
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
  const { debounceMs = 300, trackSearch = true } = options;
  const { trackEvent, trackPageView } = useAnalytics();
  const currentTime = useCurrentTime();

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
    return sortLinhas(filterLinhas(linhasDaCategoriaAtiva, searchTerm), currentTime);
  }, [linhasDaCategoriaAtiva, searchTerm, currentTime]);

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
