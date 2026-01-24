/**
 * EmptyState - Componente para estados vazios
 * Design System - Interno Rotas UFMG
 *
 * @description Feedback visual quando não há dados para exibir.
 * Suporta diferentes variantes para contextos específicos.
 */

import type { ComponentProps, ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { Search, Bus, MapPin, AlertCircle, FileQuestion } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Variantes do container de empty state
 */
export const emptyStateVariants = tv({
  base: ["flex flex-col items-center justify-center text-center", "py-8 px-4"],
  variants: {
    size: {
      sm: "py-6 gap-2",
      md: "py-8 gap-3",
      lg: "py-12 gap-4",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

/**
 * Variantes do ícone
 */
export const emptyStateIconVariants = tv({
  base: [
    "flex items-center justify-center rounded-full",
    "bg-card-hover text-text-tertiary",
  ],
  variants: {
    size: {
      sm: "size-12",
      md: "size-16",
      lg: "size-20",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

// ============================================================================
// TYPES
// ============================================================================

export interface EmptyStateProps
  extends ComponentProps<"div">, VariantProps<typeof emptyStateVariants> {
  /** Ícone personalizado */
  icon?: ReactNode;
  /** Título principal */
  title: string;
  /** Descrição adicional */
  description?: string;
  /** Ação principal */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Ação secundária */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Componente de empty state genérico
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="Nenhum resultado encontrado"
 *   description="Tente buscar por outro termo"
 *   action={{ label: "Limpar busca", onClick: handleClear }}
 * />
 * ```
 */
export function EmptyState({
  className,
  size,
  icon,
  title,
  description,
  action,
  secondaryAction,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(emptyStateVariants({ size }), className)}
      {...props}
    >
      {icon && (
        <div
          data-slot="empty-state-icon"
          className={emptyStateIconVariants({ size })}
        >
          {icon}
        </div>
      )}

      <div data-slot="empty-state-content" className="space-y-1">
        <h3
          data-slot="empty-state-title"
          className="font-semibold text-text-primary"
        >
          {title}
        </h3>
        {description && (
          <p
            data-slot="empty-state-description"
            className="text-sm text-text-secondary"
          >
            {description}
          </p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div data-slot="empty-state-actions" className="mt-2 flex gap-2">
          {action && (
            <Button variant="primary" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PRESET EMPTY STATES
// ============================================================================

/**
 * Empty state para busca sem resultados
 */
export interface SearchEmptyStateProps {
  /** Termo buscado */
  searchTerm?: string;
  /** Callback para limpar busca */
  onClear?: () => void;
  /** Tamanho do componente */
  size?: "sm" | "md" | "lg";
}

export function SearchEmptyState({
  searchTerm,
  onClear,
  size = "md",
}: SearchEmptyStateProps) {
  const iconSizes = { sm: 24, md: 32, lg: 40 };

  return (
    <EmptyState
      size={size}
      icon={<Search size={iconSizes[size]} />}
      title="Nenhum resultado encontrado"
      description={
        searchTerm
          ? `Não encontramos linhas para "${searchTerm}"`
          : "Tente buscar por nome da linha ou destino"
      }
      action={onClear ? { label: "Limpar busca", onClick: onClear } : undefined}
    />
  );
}

/**
 * Empty state para lista de linhas vazia
 */
export interface LinesEmptyStateProps {
  /** Categoria selecionada */
  category?: string;
  /** Tamanho do componente */
  size?: "sm" | "md" | "lg";
}

export function LinesEmptyState({
  category,
  size = "md",
}: LinesEmptyStateProps) {
  const iconSizes = { sm: 24, md: 32, lg: 40 };

  return (
    <EmptyState
      size={size}
      icon={<Bus size={iconSizes[size]} />}
      title="Nenhuma linha disponível"
      description={
        category
          ? `Não há linhas cadastradas para ${category}`
          : "Selecione uma categoria para ver as linhas"
      }
    />
  );
}

/**
 * Empty state para mapa sem seleção
 */
export interface MapEmptyStateProps {
  /** Tamanho do componente */
  size?: "sm" | "md" | "lg";
}

export function MapEmptyState({ size = "lg" }: MapEmptyStateProps) {
  const iconSizes = { sm: 24, md: 32, lg: 40 };

  return (
    <EmptyState
      size={size}
      icon={<MapPin size={iconSizes[size]} />}
      title="Selecione uma linha"
      description="Clique em uma linha no menu para ver seu trajeto no mapa"
    />
  );
}

/**
 * Empty state para erro genérico
 */
export interface ErrorEmptyStateProps {
  /** Mensagem de erro */
  message?: string;
  /** Callback para tentar novamente */
  onRetry?: () => void;
  /** Tamanho do componente */
  size?: "sm" | "md" | "lg";
}

export function ErrorEmptyState({
  message,
  onRetry,
  size = "md",
}: ErrorEmptyStateProps) {
  const iconSizes = { sm: 24, md: 32, lg: 40 };

  return (
    <EmptyState
      size={size}
      icon={<AlertCircle size={iconSizes[size]} />}
      title="Algo deu errado"
      description={message || "Ocorreu um erro ao carregar os dados"}
      action={
        onRetry ? { label: "Tentar novamente", onClick: onRetry } : undefined
      }
    />
  );
}

/**
 * Empty state para conteúdo não encontrado
 */
export interface NotFoundEmptyStateProps {
  /** Título personalizado */
  title?: string;
  /** Descrição personalizada */
  description?: string;
  /** Tamanho do componente */
  size?: "sm" | "md" | "lg";
}

export function NotFoundEmptyState({
  title = "Conteúdo não encontrado",
  description = "O item que você procura não existe ou foi removido",
  size = "md",
}: NotFoundEmptyStateProps) {
  const iconSizes = { sm: 24, md: 32, lg: 40 };

  return (
    <EmptyState
      size={size}
      icon={<FileQuestion size={iconSizes[size]} />}
      title={title}
      description={description}
    />
  );
}
