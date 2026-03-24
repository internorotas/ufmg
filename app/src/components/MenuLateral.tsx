/**
 * MenuLateral - Menu lateral com lista de linhas
 * Design System - Interno Rotas UFMG
 */

import { ArrowLeft, Menu } from 'lucide-react';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import logo from '../assets/logo-horizontal-transparente.svg';
import { useRotasSelection } from '../contexts/RotasContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useLinhasFilter } from '../hooks/useLinhasFilter';
import type { CategoriaLinhas, Linha, Parada } from '../types/data.types';
import { DisclaimerBanner } from './DisclaimerBanner';
import { InfoBanner } from './InfoBanner';
import { LineCard } from './LineCard';
import { MenuFooter } from './MenuFooter';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/Button';
import { SearchEmptyState } from './ui/EmptyState';
import { SearchInput } from './ui/Input';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
import { VacationBanner } from './VacationBanner';

const LinhaDetalhesModal = React.lazy(() =>
  import('./LinhaDetalhesModal').then((m) => ({ default: m.LinhaDetalhesModal })),
);

/**
 * Variantes do container sidebar
 */
export const sidebarVariants = tv({
  base: [
    'fixed inset-y-0 left-0 z-[1003] flex flex-col',
    'w-[85vw] max-w-md md:relative md:w-1/2',
    'border-r border-card-border/50 text-text-primary',
    'bg-sidebar/95 backdrop-blur-xl backdrop-saturate-150',
    'shadow-2xl md:shadow-none',
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
    'flex-1 rounded-md px-2.5 py-2 lg:py-2.5',
    'text-xs lg:text-sm font-medium',
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
  linhaSelecionada: Linha | null;
  isOffline: boolean;
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
      className="border-b border-card-border bg-background px-4 py-3 md:border-none"
    >
      <TabsList variant="pills" className="gap-2 bg-transparent p-0">
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
  linhaSelecionada,
  isOffline,
}: MenuLateralProps) {
  const analytics = useAnalytics();
  const { trackEvent } = analytics;
  const { paradaSelecionada } = useRotasSelection();
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [linhaDetalhesAberta, setLinhaDetalhesAberta] = useState<Linha | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastListSummaryRef = useRef<string>('');

  const [shortcutLabel] = useState(() => {
    if (typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)) {
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
    hasResults,
    handleCategoriaChange,
  } = useLinhasFilter(linhasData);

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
        action: 'view_stop_details',
        label: linha.nome,
      });
      setLinhaDetalhesAberta(linha);
    },
    [trackEvent],
  );

  const handleParadaClickWrapper = (parada: Parada) => {
    onParadaClick(parada);
    if (window.innerWidth < 768) {
      setMenuVisible(false);
    }
  };

  return (
    <>
      <div
        className="fixed left-1/2 top-4 z-1001 -translate-x-1/2 md:hidden"
        aria-hidden={isMenuVisible}
      >
        <div
          className={`transition-all duration-300 ${
            isMenuVisible
              ? 'pointer-events-none translate-x-20 opacity-0'
              : 'translate-x-0 opacity-100'
          }`}
        >
          <div className="rounded-xl bg-brand-primary px-4 py-2 shadow-lg backdrop-blur-sm">
            <img src={logo} alt="Logo Interno Rotas" className="h-5 w-auto" />
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 z-1001 -translate-x-1/2 md:hidden">
        <Button
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
          title="Ver Linhas"
        >
          <span className="flex items-center gap-2 text-white">
            <Menu size={24} />
            Ver Linhas
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
          aria-label="Fechar menu"
          className="fixed inset-0 z-1002 animate-fade-in bg-backdrop backdrop-blur-sm cursor-pointer md:hidden"
        />
      )}

      <aside
        data-slot="sidebar"
        data-state={isMenuVisible ? 'open' : 'closed'}
        className={sidebarVariants({ visible: isMenuVisible })}
      >
        <header
          data-slot="header"
          className="flex shrink-0 items-center justify-between bg-brand-primary p-2 shadow-sm"
        >
          <div className="flex flex-1 items-center justify-center">
            <img src={logo} alt="Logo Interno Rotas" className="h-6" />
          </div>

          <div className="flex items-center gap-2">
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
              aria-label="Fechar menu lateral"
              title="Fechar menu lateral"
            >
              <ArrowLeft size={24} />
            </Button>
          </div>
        </header>

        <div className="shrink-0 border-b border-card-border bg-background-secondary p-2 lg:p-4">
          <SearchInput
            ref={searchInputRef}
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Pesquisar linha..."
            shortcut={shortcutLabel}
          />
        </div>

        <CategoryTabs
          categories={linhasData.categoriasDias}
          activeIndex={categoriaAtiva}
          onSelect={handleCategoriaChange}
        />

        <nav
          data-slot="list"
          className="flex-1 overflow-y-auto bg-background p-4"
          aria-label="Lista de Linhas"
        >
          <VacationBanner />
          <InfoBanner />

          {hasResults ? (
            linhasFiltradas.map((linha) => (
              <LineCard
                key={linha.idRota}
                linha={linha}
                onClick={handleCardClick}
                onDetailsClick={handleDetailsClick}
                isSelected={linhaSelecionada?.idRota === linha.idRota}
                idParada={paradaSelecionada?.idParada}
              />
            ))
          ) : (
            <SearchEmptyState searchTerm={searchTerm} onClear={() => setSearchTerm('')} />
          )}

          <DisclaimerBanner isOffline={isOffline} />
        </nav>

        <MenuFooter />
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
