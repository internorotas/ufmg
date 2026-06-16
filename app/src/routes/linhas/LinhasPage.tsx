import { ArrowLeft, Info } from 'lucide-react';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trans } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { LineCard } from '@/components/LineCard';
import { CategoryTabs } from '@/components/MenuLateral';
import { SystemBanner } from '@/components/SystemBanner';
import { SearchEmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/Input';
import { getCurrentSpecialPeriod, isWeekday } from '@/config/specialPeriods';
import { useRotasData, useRotasSelection } from '@/contexts/RotasContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useLinhasFilter } from '@/hooks/useLinhasFilter';
import type { Linha, Parada } from '@/types/data.types';

const LinhaDetalhesModal = React.lazy(() =>
  import('@/components/LinhaDetalhesModal').then((m) => ({ default: m.LinhaDetalhesModal })),
);

export function LinhasPage() {
  const navigate = useNavigate();
  const { trackEvent, trackPageView } = useAnalytics();
  const { linhasData, todasParadas } = useRotasData();
  const { linhaSelecionada, selecionarLinha } = useRotasSelection();

  const [linhaDetalhesAberta, setLinhaDetalhesAberta] = useState<Linha | null>(null);
  const [movimentoPorId, setMovimentoPorId] = useState<Record<string, 'up' | 'down'>>({});
  const previousFavoritosRef = useRef<Set<string>>(new Set());

  const {
    searchTerm,
    setSearchTerm,
    categoriaAtiva,
    categoriaAtual,
    linhasFiltradas,
    handleCategoriaChange,
  } = useLinhasFilter(linhasData);

  const { favoritosIds, buscarEmFavoritas, getLinhasFavoritas } = useFavoritos();

  const specialPeriod = getCurrentSpecialPeriod();
  const isWeekdayToday = isWeekday();

  const categoriaDiaAtiva = categoriaAtual?.categoriaDia ?? '';
  const linhasFavoritas = searchTerm
    ? buscarEmFavoritas(linhasData, searchTerm, categoriaDiaAtiva)
    : getLinhasFavoritas(linhasData, categoriaDiaAtiva);
  const hasFavoritas = linhasFavoritas.length > 0;
  const favoritosIdsSet = useMemo(() => new Set(favoritosIds), [favoritosIds]);
  const linhasRegulares = linhasFiltradas.filter((linha) => !favoritosIdsSet.has(linha.idRota));
  const hasRegularResults = linhasRegulares.length > 0;

  useEffect(() => {
    trackPageView('/linhas');
  }, [trackPageView]);

  useEffect(() => {
    const previous = previousFavoritosRef.current;
    const current = new Set(favoritosIds);
    const changedIds = new Set<string>();
    const nextMovimentos: Record<string, 'up' | 'down'> = {};

    for (const id of current) {
      if (!previous.has(id)) {
        nextMovimentos[id] = 'up';
        changedIds.add(id);
      }
    }
    for (const id of previous) {
      if (!current.has(id)) {
        nextMovimentos[id] = 'down';
        changedIds.add(id);
      }
    }

    previousFavoritosRef.current = current;

    const changedArray = Array.from(changedIds);
    if (changedArray.length === 0) return;

    setMovimentoPorId((v) => ({ ...v, ...nextMovimentos }));

    const timer = window.setTimeout(() => {
      setMovimentoPorId((v) => {
        const cleaned = { ...v };
        for (const id of changedArray) delete cleaned[id];
        return cleaned;
      });
    }, 280);

    return () => window.clearTimeout(timer);
  }, [favoritosIds]);

  const handleLinhaClick = useCallback(
    (linha: Linha) => {
      trackEvent({
        category: 'navigation',
        action: 'select_line_from_linhas_page',
        label: `${linha.nome} | categoria=${categoriaAtual?.displayName ?? 'desconhecida'}`,
      });
      selecionarLinha(linha);
      navigate('/');
    },
    [categoriaAtual?.displayName, navigate, selecionarLinha, trackEvent],
  );

  const handleFavoritaClick = useCallback(
    (linha: Linha) => {
      trackEvent({
        category: 'preferences',
        action: 'favorite_section_click',
        label: linha.idRota,
      });
      handleLinhaClick(linha);
    },
    [handleLinhaClick, trackEvent],
  );

  const handleDetailsClick = useCallback(
    (linha: Linha) => {
      trackEvent({ category: 'navigation', action: 'open_line_details', label: linha.nome });
      setLinhaDetalhesAberta(linha);
    },
    [trackEvent],
  );

  const handleParadaClick = useCallback(
    (_parada: Parada) => {
      navigate('/');
    },
    [navigate],
  );

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden text-text-primary">
      {/* Header */}
      <header className="shrink-0 neo-brutal-sm bg-brand-primary px-3 py-2">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Voltar ao mapa"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </Link>
          <h1 className="text-sm font-semibold text-white">Linhas e paradas</h1>
        </div>
      </header>

      {/* Search */}
      <div className="shrink-0 neo-brutal-sm bg-background-secondary p-2 lg:p-3">
        <SearchInput
          value={searchTerm}
          onValueChange={setSearchTerm}
          placeholder="Pesquisar linha..."
          aria-label="Pesquisar linha por nome, sublinha ou descrição"
        />
      </div>

      {/* Category tabs */}
      <CategoryTabs
        categories={linhasData.categoriasDias}
        activeIndex={categoriaAtiva}
        onSelect={handleCategoriaChange}
      />

      {/* Scrollable list */}
      <main
        id="linhas-main"
        tabIndex={-1}
        className="flex-1 overflow-y-auto bg-background p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4"
        aria-label="Lista de linhas"
      >
        {specialPeriod ? (
          <SystemBanner
            variant="warning"
            icon={<Info aria-hidden="true" />}
            title={specialPeriod.name}
            description={
              <>
                <p>
                  <Trans
                    i18nKey="vacation.description"
                    ns="system-banner"
                    values={{
                      start: specialPeriod.startDate.toLocaleDateString('pt-BR'),
                      end: specialPeriod.endDate.toLocaleDateString('pt-BR'),
                    }}
                  />
                </p>
                {!isWeekdayToday && (
                  <p className="mt-2 font-semibold">
                    <Trans i18nKey="vacation.weekendWarning" ns="system-banner" />
                  </p>
                )}
              </>
            }
          />
        ) : null}

        <SystemBanner
          variant="info"
          icon={<Info aria-hidden="true" />}
          description={
            <Trans
              i18nKey="info.description"
              ns="system-banner"
              components={{ strong: <strong /> }}
            />
          }
        />

        {hasFavoritas && (
          <section aria-label="Linhas favoritas">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Favoritas
            </p>
            {linhasFavoritas.map((linha) => (
              <div
                key={linha.idRota}
                className={
                  movimentoPorId[linha.idRota] === 'up'
                    ? 'motion-safe:animate-line-favorite-up'
                    : ''
                }
              >
                <LineCard
                  linha={linha}
                  onClick={handleFavoritaClick}
                  onDetailsClick={handleDetailsClick}
                  isSelected={linhaSelecionada?.idRota === linha.idRota}
                  isFavorita={true}
                />
              </div>
            ))}
            <div className="mb-3 mt-1 border-b-2 border-card-border" aria-hidden="true" />
          </section>
        )}

        {hasFavoritas && hasRegularResults && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Todas as Linhas
          </p>
        )}

        {hasRegularResults
          ? linhasRegulares.map((linha) => (
              <div
                key={linha.idRota}
                className={
                  movimentoPorId[linha.idRota] === 'down'
                    ? 'motion-safe:animate-line-favorite-down'
                    : ''
                }
              >
                <LineCard
                  linha={linha}
                  onClick={handleLinhaClick}
                  onDetailsClick={handleDetailsClick}
                  isSelected={linhaSelecionada?.idRota === linha.idRota}
                  isFavorita={false}
                />
              </div>
            ))
          : !hasFavoritas && (
              <SearchEmptyState searchTerm={searchTerm} onClear={() => setSearchTerm('')} />
            )}
      </main>

      {linhaDetalhesAberta && (
        <Suspense fallback={null}>
          <LinhaDetalhesModal
            isOpen={true}
            onClose={() => {
              trackEvent({
                category: 'navigation',
                action: 'close_line_details_modal',
                label: linhaDetalhesAberta.nome,
              });
              setLinhaDetalhesAberta(null);
            }}
            linha={linhaDetalhesAberta}
            todasParadas={todasParadas}
            onParadaClick={handleParadaClick}
          />
        </Suspense>
      )}
    </div>
  );
}
