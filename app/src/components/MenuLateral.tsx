/**
 * MenuLateral - Menu lateral com lista de linhas
 * Design System - Interno Rotas UFMG
 */

import { ArrowLeft, Info, Menu, Route, X } from 'lucide-react';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { tv, type VariantProps } from 'tailwind-variants';
import { getCurrentSpecialPeriod, isWeekday } from '@/config/specialPeriods';
import {
  type PartnerSpotlight,
  PartnerSpotlightCard,
} from '@/features/monetization/components/PartnerSpotlightCard';
import { usePlannerStore } from '@/features/planner/store/plannerStore';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';
import logo from '../assets/logo-horizontal-transparente.svg';
import { useRotasSelection } from '../contexts/RotasContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useFavoritos } from '../hooks/useFavoritos';
import { useLinhasFilter } from '../hooks/useLinhasFilter';
import type { CategoriaLinhas, Linha, Parada } from '../types/data.types';
import type { LegalModalType } from '../types/legal.types';
import { DisclaimerBanner } from './DisclaimerBanner';
import { LineCard } from './LineCard';
import { MenuFooter } from './MenuFooter';
import { SystemBanner } from './SystemBanner';
import { ThemeToggle } from './ThemeToggle';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { SearchEmptyState } from './ui/EmptyState';
import { SearchInput } from './ui/Input';
import { Skeleton } from './ui/Skeleton';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';

const LinhaDetalhesModal = React.lazy(() =>
  import('@/components/LinhaDetalhesModal').then((m) => ({ default: m.LinhaDetalhesModal })),
);

const PlannerPanel = React.lazy(() =>
  import('@/features/planner/components/PlannerPanel').then((m) => ({ default: m.PlannerPanel })),
);

/**
 * Variantes do container sidebar
 */
export const sidebarVariants = tv({
  base: [
    'fixed inset-y-0 left-0 z-[1003] flex h-[100dvh] flex-col',
    'w-screen max-w-none md:relative md:h-full md:w-1/2 md:max-w-md',
    'border-r border-card-border/50 text-text-primary',
    'bg-sidebar/95 backdrop-blur-xl backdrop-saturate-150',
    'shadow-2xl md:shadow-none',
    'overflow-hidden',
    'transform transition-transform duration-300',
  ],
  variants: {
    visible: {
      true: 'translate-x-0',
      false: '-translate-x-full md:translate-x-0',
    },
  },
  defaultVariants: {
    visible: false,
  },
});

/**
 * Variantes do botão de tab de categoria (usando variante pills do Tabs)
 */
export const categoryTabVariants = tv({
  base: [
    'flex-1 min-h-11 rounded-md px-2 py-1.5 lg:py-2.5',
    'text-[0.75rem] sm:text-xs lg:text-sm font-medium leading-tight text-center',
    'whitespace-normal break-words overflow-visible text-clip',
    'cursor-pointer transition-all duration-150 ease-out',
    'active:scale-[0.97]',
    'data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-sm',
    'data-[state=inactive]:bg-background-secondary data-[state=inactive]:text-text-secondary',
    'data-[state=inactive]:border data-[state=inactive]:border-card-border data-[state=inactive]:shadow-sm',
    'data-[state=inactive]:hover:bg-card-hover data-[state=inactive]:hover:text-text-primary',
    'data-[state=inactive]:hover:border-card-border',
  ],
});

export interface MenuLateralProps extends VariantProps<typeof sidebarVariants> {
  linhasData: CategoriaLinhas;
  todasParadas: Parada[];
  onLinhaSelect: (linha: Linha) => void;
  onParadaClick: (parada: Parada) => void;
  onOpenLegalModal?: (modalType: LegalModalType) => void;
  linhaSelecionada: Linha | null;
  isOffline: boolean;
  authStatus: 'booting' | 'authenticated' | 'anonymous';
  isAuthenticated: boolean;
  onAuthAction: () => void;
  userScore?: number | null;
  onPlannerRouteSelected?: () => void;
  onRegisterMenuOpen?: (fn: () => void) => void;
}

interface CategoryTabsProps {
  categories: CategoriaLinhas['categoriasDias'];
  activeIndex: number;
  onSelect: (index: number) => void;
}

function CategoryTabs({ categories, activeIndex, onSelect }: CategoryTabsProps) {
  const activeValue = String(categories[activeIndex]?.id ?? '');

  const handleValueChange = (value: string) => {
    const numericId = Number(value);
    const index = categories.findIndex((cat) => cat.id === numericId);
    if (index !== -1) {
      onSelect(index);
    }
  };

  return (
    <Tabs
      value={activeValue}
      onValueChange={handleValueChange}
      className="border-b border-card-border bg-background px-3 py-2 md:border-none md:px-4 md:py-3"
    >
      <TabsList variant="pills" className="gap-1.5 bg-transparent p-0">
        {categories.map((categoria) => (
          <TabsTrigger
            key={categoria.id}
            value={String(categoria.id)}
            className={categoryTabVariants()}
          >
            {categoria.displayName}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function resolvePartnerSpotlightEndpoint(): string {
  return resolveApiEndpoint('/v1/partners/active');
}

function isPartnerSpotlight(value: unknown): value is PartnerSpotlight {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.slug === 'string' &&
    typeof candidate.nome === 'string' &&
    typeof candidate.descricaoCurta === 'string' &&
    (typeof candidate.logoUrl === 'string' || candidate.logoUrl === null) &&
    typeof candidate.urlDestino === 'string' &&
    (typeof candidate.badgeSlug === 'string' || candidate.badgeSlug === null)
  );
}

async function fetchActivePartnerSpotlight(): Promise<PartnerSpotlight | null> {
  const response = await fetch(resolvePartnerSpotlightEndpoint(), {
    method: 'GET',
    cache: 'no-store',
    headers: withTenantHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar parceiro ativo: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (payload === null) {
    return null;
  }

  if (!isPartnerSpotlight(payload)) {
    throw new Error('Resposta de parceiro institucional inválida.');
  }

  return payload;
}

/**
 * Menu lateral que exibe lista de linhas de ônibus com busca e categorias.
 *
 * @example
 * ```tsx
 * <MenuLateral
 *   linhasData={linhasData}
 *   todasParadas={todasParadas}
 *   onLinhaSelect={handleSelect}
 *   onParadaClick={handleParadaClick}
 *   linhaSelecionada={selectedLinha}
 * />
 * ```
 */
export const MenuLateral = React.memo(function MenuLateral({
  linhasData,
  todasParadas,
  onLinhaSelect,
  onParadaClick,
  onOpenLegalModal,
  linhaSelecionada,
  isOffline,
  authStatus,
  isAuthenticated,
  onAuthAction,
  userScore,
  onPlannerRouteSelected,
  onRegisterMenuOpen,
}: MenuLateralProps) {
  const { t } = useTranslation('menu');
  const analytics = useAnalytics();
  const { trackEvent } = analytics;
  const { paradaSelecionada } = useRotasSelection();
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );
  const [linhaDetalhesAberta, setLinhaDetalhesAberta] = useState<Linha | null>(null);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [partnerSpotlight, setPartnerSpotlight] = useState<PartnerSpotlight | null>(null);
  const selectedRouteId = usePlannerStore((state) => state.selectedRouteId);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const lastListSummaryRef = useRef<string>('');
  const wasMenuVisibleRef = useRef(false);
  const previousFavoritosRef = useRef<Set<string>>(new Set());
  const [movimentoPorId, setMovimentoPorId] = useState<Record<string, 'up' | 'down'>>({});

  const [shortcutLabel] = useState(() => {
    if (typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/i.test(navigator.userAgent)) {
      return '⌘K';
    }
    return 'Ctrl+K';
  });

  const {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    categoriaAtiva,
    categoriaAtual,
    linhasFiltradas,
    handleCategoriaChange,
  } = useLinhasFilter(linhasData);
  const { favoritosIds, buscarEmFavoritas, getLinhasFavoritas } = useFavoritos();

  const categoriaDiaAtiva = categoriaAtual?.categoriaDia ?? '';
  const linhasFavoritas = searchTerm
    ? buscarEmFavoritas(linhasData, searchTerm, categoriaDiaAtiva)
    : getLinhasFavoritas(linhasData, categoriaDiaAtiva);
  const hasFavoritas = linhasFavoritas.length > 0;
  const favoritosIdsSet = useMemo(() => new Set(favoritosIds), [favoritosIds]);
  const linhasRegulares = linhasFiltradas.filter((linha) => !favoritosIdsSet.has(linha.idRota));
  const hasRegularResults = linhasRegulares.length > 0;

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
    if (changedArray.length === 0) {
      return;
    }

    setMovimentoPorId((value) => ({ ...value, ...nextMovimentos }));

    const clearAnimation = window.setTimeout(() => {
      setMovimentoPorId((value) => {
        const cleaned = { ...value };
        for (const id of changedArray) {
          delete cleaned[id];
        }
        return cleaned;
      });
    }, 280);

    return () => window.clearTimeout(clearAnimation);
  }, [favoritosIds]);

  const specialPeriod = getCurrentSpecialPeriod();
  const isWeekdayToday = isWeekday();

  useEffect(() => {
    const categoria = categoriaAtual?.displayName || 'desconhecida';
    const summary = `${categoria}|${debouncedSearchTerm}|${linhasFiltradas.length}`;

    if (summary === lastListSummaryRef.current) {
      return;
    }

    lastListSummaryRef.current = summary;

    trackEvent({
      category: 'engagement',
      action: 'filter_lines_summary',
      label: `categoria=${categoria};busca=${debouncedSearchTerm || 'vazio'};resultado=${linhasFiltradas.length}`,
      value: linhasFiltradas.length,
    });
  }, [categoriaAtual?.displayName, debouncedSearchTerm, linhasFiltradas.length, trackEvent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();

        if (window.innerWidth < 768) {
          setMenuVisible(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let active = true;

    void fetchActivePartnerSpotlight()
      .then((partner) => {
        if (active) {
          setPartnerSpotlight(partner);
        }
      })
      .catch(() => {
        if (active) {
          setPartnerSpotlight(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);

    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    onRegisterMenuOpen?.(() => setMenuVisible(true));
  }, [onRegisterMenuOpen]);

  useEffect(() => {
    if (!selectedRouteId || !isMobileViewport) {
      return;
    }

    setMenuVisible(false);
    onPlannerRouteSelected?.();
  }, [selectedRouteId, isMobileViewport, onPlannerRouteSelected]);

  useEffect(() => {
    if (!isMobileViewport) {
      if (isMenuVisible) {
        setMenuVisible(false);
      }
      return;
    }

    if (!isMenuVisible) {
      if (wasMenuVisibleRef.current) {
        mobileTriggerRef.current?.focus();
      }
      wasMenuVisibleRef.current = false;
      return;
    }

    wasMenuVisibleRef.current = true;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuVisible(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuVisible, isMobileViewport]);

  const handleCardClick = useCallback(
    (linha: Linha) => {
      trackEvent({
        category: 'navigation',
        action: 'select_line_from_menu',
        label: `${linha.nome} | categoria=${categoriaAtual?.displayName || 'desconhecida'}`,
      });
      onLinhaSelect(linha);
      if (window.innerWidth < 768) {
        setMenuVisible(false);
      }
    },
    [categoriaAtual?.displayName, onLinhaSelect, trackEvent],
  );

  const handleDetailsClick = useCallback(
    (linha: Linha) => {
      trackEvent({
        category: 'navigation',
        action: 'open_line_details',
        label: linha.nome,
      });
      setLinhaDetalhesAberta(linha);
    },
    [trackEvent],
  );

  const handleFavoritaCardClick = useCallback(
    (linha: Linha) => {
      trackEvent({
        category: 'preferences',
        action: 'favorite_section_click',
        label: linha.idRota,
      });
      handleCardClick(linha);
    },
    [handleCardClick, trackEvent],
  );

  const handleParadaClickWrapper = (parada: Parada) => {
    onParadaClick(parada);
    if (window.innerWidth < 768) {
      setMenuVisible(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-24 left-1/2 z-1001 -translate-x-1/2 md:hidden [margin-bottom:env(safe-area-inset-bottom)]">
        <Button
          ref={mobileTriggerRef}
          data-slot="mobile-trigger"
          onClick={() => {
            analytics.trackEvent({
              category: 'navigation',
              action: 'open_menu',
              label: 'mobile_trigger',
            });
            setMenuVisible(true);
          }}
          variant="primary"
          size="lg"
          className="gap-3 rounded-full px-6 shadow-lg"
          aria-controls="menu-lateral-sidebar"
          aria-expanded={isMenuVisible}
          aria-haspopup="dialog"
          title={t('mobile.openLines')}
        >
          <span className="flex items-center gap-2 text-white">
            <Menu size={24} aria-hidden="true" />
            {t('mobile.openLines')}
          </span>
        </Button>
      </div>

      {isMenuVisible && (
        <button
          type="button"
          data-slot="backdrop"
          onClick={() => {
            analytics.trackEvent({
              category: 'navigation',
              action: 'close_menu',
              label: 'backdrop',
            });
            setMenuVisible(false);
          }}
          aria-label={t('mobile.closeMenu')}
          className="fixed inset-0 z-1002 animate-fade-in bg-backdrop backdrop-blur-sm cursor-pointer md:hidden"
        />
      )}

      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-modal é válido quando role="dialog" está ativo (isMobileViewport) */}
      <aside
        id="menu-lateral-sidebar"
        data-slot="sidebar"
        data-state={isMenuVisible ? 'open' : 'closed'}
        role={isMobileViewport ? 'dialog' : undefined}
        aria-label="Menu de linhas de ônibus"
        aria-modal={isMobileViewport && isMenuVisible ? true : undefined}
        aria-hidden={isMobileViewport && !isMenuVisible ? true : undefined}
        inert={isMobileViewport && !isMenuVisible ? true : undefined}
        className={sidebarVariants({ visible: isMenuVisible })}
      >
        <header
          data-slot="header"
          className="flex shrink-0 items-center justify-between gap-2 bg-brand-primary px-3 py-2 shadow-sm"
        >
          <div className="flex min-w-0 items-center gap-2">
            {authStatus === 'booting' ? (
              <Skeleton
                className="h-9 w-20 bg-white/15"
                rounded="full"
                aria-label="Carregando sessão"
              />
            ) : (
              <>
                <Button
                  type="button"
                  onClick={onAuthAction}
                  variant="ghost"
                  size="sm"
                  className="min-h-9 shrink-0 rounded-full bg-white px-3 text-xs font-semibold text-brand-primary shadow-sm hover:bg-white/90"
                >
                  {isAuthenticated ? 'Perfil' : 'Entrar'}
                </Button>
                {isAuthenticated && typeof userScore === 'number' ? (
                  <Badge
                    variant="ouro"
                    size="sm"
                    className="shrink-0 bg-white/95 text-brand-primary"
                  >
                    {userScore} pts
                  </Badge>
                ) : null}
              </>
            )}
          </div>
          <div className="flex flex-1 items-center justify-center">
            <img src={logo} alt="Logo Interno Rotas" className="h-6" width="138" height="24" />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <Button
              data-slot="close"
              onClick={() => {
                analytics.trackEvent({
                  category: 'navigation',
                  action: 'close_menu',
                  label: 'header_button',
                });
                setMenuVisible(false);
              }}
              variant="ghost"
              size="sm"
              className="rounded-lg p-2 text-white hover:bg-white/20 md:hidden"
              aria-label={t('header.closeMenu')}
              title={t('header.closeMenu')}
            >
              <ArrowLeft size={24} aria-hidden="true" />
            </Button>
          </div>
        </header>

        <div className="shrink-0 border-b border-card-border bg-background-secondary p-2 lg:p-3">
          <SearchInput
            ref={searchInputRef}
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder={t('search.placeholder')}
            aria-label={t('search.aria')}
            shortcut={shortcutLabel}
          />
        </div>

        {/* Ação de planejamento de rota */}
        <div className="shrink-0 border-b border-card-border bg-background-secondary px-2 pb-2 lg:px-3 lg:pb-2.5">
          <button
            type="button"
            data-slot="planner-toggle"
            onClick={() => setIsPlannerOpen((prev) => !prev)}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-expanded={isPlannerOpen}
            aria-controls="planner-panel"
            aria-label={isPlannerOpen ? 'Fechar planejador de rota' : 'Planejar rota'}
          >
            <Route size={16} className="shrink-0 text-brand-primary" aria-hidden="true" />
            <span className="flex-1 text-left">Planejar rota</span>
            {isPlannerOpen && (
              <X size={14} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            )}
          </button>
        </div>

        {isPlannerOpen && (
          <div id="planner-panel" className="shrink-0">
            <Suspense fallback={null}>
              <PlannerPanel />
            </Suspense>
          </div>
        )}

        {!isPlannerOpen && (
          <CategoryTabs
            categories={linhasData.categoriasDias}
            activeIndex={categoriaAtiva}
            onSelect={handleCategoriaChange}
          />
        )}

        <nav
          data-slot="list"
          className={`flex-1 overflow-y-auto bg-background p-4 ${isPlannerOpen ? 'hidden' : ''}`}
          aria-label={t('list.aria')}
          hidden={isPlannerOpen}
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

          {partnerSpotlight ? (
            <PartnerSpotlightCard
              partner={partnerSpotlight}
              onClick={() => {
                trackEvent({
                  category: 'navigation',
                  action: 'click_partner_spotlight',
                  label: partnerSpotlight.slug,
                });
              }}
            />
          ) : null}

          {hasFavoritas && (
            <section aria-label="Linhas favoritas" data-slot="favorites-section">
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary"
                data-slot="section-label"
              >
                Favoritas
              </p>
              {linhasFavoritas.map((linha) => {
                const animationClass =
                  movimentoPorId[linha.idRota] === 'up'
                    ? 'motion-safe:animate-line-favorite-up'
                    : '';

                return (
                  <div key={linha.idRota} className={animationClass}>
                    <LineCard
                      linha={linha}
                      onClick={handleFavoritaCardClick}
                      onDetailsClick={handleDetailsClick}
                      isSelected={linhaSelecionada?.idRota === linha.idRota}
                      idParada={paradaSelecionada?.idParada}
                      isFavorita={true}
                    />
                  </div>
                );
              })}
              <div className="mb-3 mt-1 border-b border-card-border" aria-hidden="true" />
            </section>
          )}

          {hasFavoritas && hasRegularResults && (
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary"
              data-slot="section-label"
            >
              Todas as Linhas
            </p>
          )}

          {hasRegularResults
            ? linhasRegulares.map((linha) => {
                const animationClass =
                  movimentoPorId[linha.idRota] === 'down'
                    ? 'motion-safe:animate-line-favorite-down'
                    : '';

                return (
                  <div key={linha.idRota} className={animationClass}>
                    <LineCard
                      linha={linha}
                      onClick={handleCardClick}
                      onDetailsClick={handleDetailsClick}
                      isSelected={linhaSelecionada?.idRota === linha.idRota}
                      idParada={paradaSelecionada?.idParada}
                      isFavorita={false}
                    />
                  </div>
                );
              })
            : !hasFavoritas && (
                <SearchEmptyState searchTerm={searchTerm} onClear={() => setSearchTerm('')} />
              )}

          <DisclaimerBanner isOffline={isOffline} />
        </nav>

        <div className="shrink-0 border-t border-card-border bg-background p-4 md:hidden">
          <Button
            data-slot="back-to-map"
            onClick={() => {
              analytics.trackEvent({
                category: 'navigation',
                action: 'back_to_map',
                label: paradaSelecionada?.idParada ?? linhaSelecionada?.idRota ?? 'sem-contexto',
              });

              if (paradaSelecionada) {
                onParadaClick(paradaSelecionada);
              } else if (linhaSelecionada) {
                onLinhaSelect(linhaSelecionada);
              }

              setMenuVisible(false);
            }}
            variant="primary"
            size="lg"
            fullWidth
            className="min-h-11"
            aria-label={t('list.backToMap')}
            title={t('list.backToMap')}
          >
            {t('list.backToMap')}
          </Button>
        </div>

        <MenuFooter onOpenLegalModal={onOpenLegalModal} />
      </aside>

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
            onParadaClick={handleParadaClickWrapper}
          />
        </Suspense>
      )}
    </>
  );
});
