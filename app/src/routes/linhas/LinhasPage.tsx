import { ArrowLeft, Info, LayoutList, Star } from 'lucide-react';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trans } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { LineCard } from '@/components/LineCard';
import { CategoryTabs } from '@/components/MenuLateral';
import { SystemBanner } from '@/components/SystemBanner';
import { EmptyState, SearchEmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { getCurrentSpecialPeriod, isWeekday } from '@/config/specialPeriods';
import { useRotasData, useRotasSelection } from '@/contexts/RotasContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useLinhasFilter } from '@/hooks/useLinhasFilter';
import type { Linha, Parada } from '@/types/data.types';

const LinhaDetalhesModal = React.lazy(() =>
  import('@/components/LinhaDetalhesModal').then((m) => ({ default: m.LinhaDetalhesModal })),
);

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export function LinhasPage() {
  const navigate = useNavigate();
  const { trackEvent, trackPageView } = useAnalytics();
  const { linhasData, todasParadas } = useRotasData();
  const { linhaSelecionada, selecionarLinha } = useRotasSelection();
  const isDesktop = useIsDesktop();

  const [linhaDetalhesAberta, setLinhaDetalhesAberta] = useState<Linha | null>(null);
  const [filtroAtivo, setFiltroAtivo] = useState<'todas' | 'favoritas'>('todas');
  const [vacationBannerDismissed, setVacationBannerDismissed] = useState(false);
  const [infoBannerDismissed, setInfoBannerDismissed] = useState(false);
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

  const handleCloseDetails = useCallback(() => {
    if (linhaDetalhesAberta) {
      trackEvent({
        category: 'navigation',
        action: 'close_line_details_modal',
        label: linhaDetalhesAberta.nome,
      });
    }
    setLinhaDetalhesAberta(null);
  }, [linhaDetalhesAberta, trackEvent]);

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden text-text-primary">
      {/* Header */}
      <header className="shrink-0 bg-brand-primary px-3 py-2 shadow-(--elevation-2)">
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
      <div className="shrink-0 border-b border-card-border bg-background-secondary p-2 lg:p-3">
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

      {/* Filtro Todas/Favoritas */}
      <div className="shrink-0 border-b border-card-border bg-background-secondary px-2 py-2 lg:px-3">
        <Tabs
          value={filtroAtivo}
          onValueChange={(value) => setFiltroAtivo(value as 'todas' | 'favoritas')}
        >
          <TabsList variant="pills" fullWidth={false}>
            <TabsTrigger value="todas" fullWidth={false}>
              Todas
            </TabsTrigger>
            <TabsTrigger value="favoritas" fullWidth={false}>
              Favoritas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Two-column area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: scrollable list */}
        <main
          id="linhas-main"
          tabIndex={-1}
          className="flex-1 overflow-y-auto bg-background p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4 lg:max-w-120 lg:shrink-0 lg:border-r lg:border-card-border"
          aria-label="Lista de linhas"
        >
          {specialPeriod && !vacationBannerDismissed ? (
            <SystemBanner
              variant="warning"
              icon={<Info aria-hidden="true" />}
              title={specialPeriod.name}
              onDismiss={() => setVacationBannerDismissed(true)}
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

          {!infoBannerDismissed && (
            <SystemBanner
              variant="info"
              icon={<Info aria-hidden="true" />}
              onDismiss={() => setInfoBannerDismissed(true)}
              description={
                <Trans
                  i18nKey="info.description"
                  ns="system-banner"
                  components={{ strong: <strong /> }}
                />
              }
            />
          )}

          {filtroAtivo === 'favoritas' ? (
            hasFavoritas ? (
              <section aria-label="Linhas favoritas">
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
              </section>
            ) : (
              <EmptyState
                tone="accent"
                icon={<Star size={32} />}
                title="Nenhum favorito ainda"
                description="Toque na estrela em uma linha para salvá-la aqui e acessar rapidamente."
              />
            )
          ) : (
            <>
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
                  <div className="mb-3 mt-1 border-b border-card-border" aria-hidden="true" />
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
            </>
          )}
        </main>

        {/* Right: inline details panel (desktop only) */}
        {isDesktop && (
          <aside className="flex flex-1 flex-col overflow-hidden bg-background border-l border-card-border">
            {linhaDetalhesAberta ? (
              <Suspense fallback={null}>
                <LinhaDetalhesModal
                  inline
                  isOpen={true}
                  onClose={handleCloseDetails}
                  linha={linhaDetalhesAberta}
                  todasParadas={todasParadas}
                  onParadaClick={handleParadaClick}
                />
              </Suspense>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-(--shape-lg) bg-background-secondary text-text-tertiary">
                  <LayoutList size={24} aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-text-secondary">
                  Selecione uma linha para ver itinerário e horários
                </p>
                <p className="text-xs text-text-tertiary">
                  Clique em "Detalhes" em qualquer linha da lista
                </p>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Mobile: overlay modal */}
      {!isDesktop && linhaDetalhesAberta && (
        <Suspense fallback={null}>
          <LinhaDetalhesModal
            isOpen={true}
            onClose={handleCloseDetails}
            linha={linhaDetalhesAberta}
            todasParadas={todasParadas}
            onParadaClick={handleParadaClick}
          />
        </Suspense>
      )}
    </div>
  );
}
