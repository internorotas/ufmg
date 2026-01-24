/**
 * MenuLateral - Menu lateral com lista de linhas
 * Design System - Interno Rotas UFMG
 */

import { useState, type ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { Search, Menu, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";
import { useLinhasFilter } from "../hooks/useLinhasFilter";
import { LinhaDetalhesModal } from "./LinhaDetalhesModal";
import { ThemeToggle } from "./ThemeToggle";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { InfoBanner } from "./InfoBanner";
import { VacationBanner } from "./VacationBanner";
import { MenuFooter } from "./MenuFooter";
import { LineCard } from "./LineCard";
import { SearchEmptyState } from "./ui/EmptyState";
import { Tabs, TabsList, TabsTrigger } from "./ui/Tabs";
import type { Linha, CategoriaLinhas, Parada } from "../types/data.types";
import logo from "../assets/logo-horizontal-transparente.svg";

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Variantes do container sidebar
 */
export const sidebarVariants = tv({
  base: [
    "fixed inset-y-0 left-0 z-[1003] flex flex-col",
    "w-[85vw] max-w-md md:relative md:w-1/2",
    "border-r border-card-border/50 text-text-primary",
    // Glassmorphism effect
    "bg-sidebar/95 backdrop-blur-xl backdrop-saturate-150",
    "shadow-2xl md:shadow-none",
    "transform transition-transform duration-300",
  ],
  variants: {
    visible: {
      true: "translate-x-0",
      false: "-translate-x-full md:translate-x-0",
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
    "flex-1 rounded-md px-2.5 py-2 lg:py-2.5",
    "text-xs lg:text-sm font-medium",
    "cursor-pointer transition-all duration-150 ease-out",
    "active:scale-[0.97]",
    "data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-sm",
    "data-[state=inactive]:bg-card data-[state=inactive]:text-text-secondary",
    "data-[state=inactive]:hover:bg-card-hover data-[state=inactive]:hover:text-text-primary",
    "data-[state=inactive]:border data-[state=inactive]:border-transparent",
    "data-[state=inactive]:hover:border-card-border",
  ],
});

/**
 * Variantes do input de busca
 */
export const searchInputVariants = tv({
  base: [
    "w-full rounded-lg border bg-input pl-10 pr-4 py-2.5 lg:py-3",
    "border-input-border text-text-primary",
    "placeholder:text-text-tertiary",
    "transition-all duration-200",
    "focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary",
  ],
});

/**
 * Variantes do botão mobile
 */
export const mobileButtonVariants = tv({
  base: [
    "flex items-center gap-3 rounded-full px-6 py-3",
    "bg-brand-primary text-white font-bold shadow-lg",
    "cursor-pointer transition-colors",
    "hover:bg-blue-700 active:scale-95",
  ],
});

// ============================================================================
// TYPES
// ============================================================================

export interface MenuLateralProps extends VariantProps<typeof sidebarVariants> {
  linhasData: CategoriaLinhas;
  todasParadas: Parada[];
  onLinhaSelect: (linha: Linha) => void;
  onParadaClick: (parada: Parada) => void;
  linhaSelecionada: Linha | null;
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface SearchInputProps extends ComponentProps<"input"> {
  value: string;
  onValueChange: (value: string) => void;
}

function SearchInput({ value, onValueChange, className, ...props }: SearchInputProps) {
  return (
    <div data-slot="search" className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-secondary"
      />
      <input
        type="text"
        placeholder="Pesquisar linha..."
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(searchInputVariants(), className)}
        {...props}
      />
    </div>
  );
}

interface CategoryTabsProps {
  categories: CategoriaLinhas["categoriasDias"];
  activeIndex: number;
  onSelect: (index: number) => void;
}

function CategoryTabs({ categories, activeIndex, onSelect }: CategoryTabsProps) {
  // Converte id numérico para string para o Tabs component
  const activeValue = String(categories[activeIndex]?.id ?? "");

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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
export function MenuLateral({
  linhasData,
  todasParadas,
  onLinhaSelect,
  onParadaClick,
  linhaSelecionada,
}: MenuLateralProps) {
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [linhaDetalhesAberta, setLinhaDetalhesAberta] = useState<Linha | null>(null);

  const {
    searchTerm,
    setSearchTerm,
    categoriaAtiva,
    linhasFiltradas,
    hasResults,
    handleCategoriaChange,
  } = useLinhasFilter(linhasData);

  const handleCardClick = (linha: Linha) => {
    onLinhaSelect(linha);
    if (window.innerWidth < 768) {
      setMenuVisible(false);
    }
  };

  const handleDetailsClick = (linha: Linha) => {
    setLinhaDetalhesAberta(linha);
  };

  const handleParadaClickWrapper = (parada: Parada) => {
    onParadaClick(parada);
    if (window.innerWidth < 768) {
      setMenuVisible(false);
    }
  };

  return (
    <>
      {/* Mobile Trigger Button */}
      <div className="fixed bottom-6 left-1/2 z-1001 -translate-x-1/2 md:hidden">
        <button
          data-slot="mobile-trigger"
          onClick={() => setMenuVisible(true)}
          className={mobileButtonVariants()}
        >
          <Menu size={24} />
          Ver Linhas
        </button>
      </div>

      {/* Backdrop */}
      {isMenuVisible && (
        <div
          data-slot="backdrop"
          onClick={() => setMenuVisible(false)}
          className="fixed inset-0 z-1002 animate-fade-in bg-backdrop backdrop-blur-sm cursor-pointer md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        data-slot="sidebar"
        data-state={isMenuVisible ? "open" : "closed"}
        className={sidebarVariants({ visible: isMenuVisible })}
      >
        {/* Header */}
        <header
          data-slot="header"
          className="flex shrink-0 items-center justify-between bg-brand-primary p-2 shadow-sm"
        >
          <div className="flex flex-1 items-center justify-center">
            <img src={logo} alt="Logo Interno Rotas" className="h-6" />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              data-slot="close"
              onClick={() => setMenuVisible(false)}
              className="cursor-pointer rounded-lg p-2 text-white transition-colors hover:bg-white/20 md:hidden"
            >
              <ArrowLeft size={24} />
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="shrink-0 border-b border-card-border bg-background-secondary p-2 lg:p-4">
          <SearchInput
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
        </div>

        {/* Category Tabs */}
        <CategoryTabs
          categories={linhasData.categoriasDias}
          activeIndex={categoriaAtiva}
          onSelect={handleCategoriaChange}
        />

        {/* Lines List */}
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
                onClick={() => handleCardClick(linha)}
                onDetailsClick={() => handleDetailsClick(linha)}
                isSelected={linhaSelecionada?.idRota === linha.idRota}
              />
            ))
          ) : (
            <SearchEmptyState
              searchTerm={searchTerm}
              onClear={() => setSearchTerm("")}
            />
          )}

          <DisclaimerBanner />
        </nav>

        {/* Footer */}
        <MenuFooter />
      </aside>

      {/* Details Modal */}
      {linhaDetalhesAberta && (
        <LinhaDetalhesModal
          isOpen={true}
          onClose={() => setLinhaDetalhesAberta(null)}
          linha={linhaDetalhesAberta}
          todasParadas={todasParadas}
          onParadaClick={handleParadaClickWrapper}
        />
      )}
    </>
  );
}
