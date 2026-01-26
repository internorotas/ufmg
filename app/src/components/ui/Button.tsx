/**
 * Button - Componente base de botão
 * Design System - Interno Rotas UFMG
 *
 * @description Botão reutilizável com variantes de estilo e tamanho.
 * Segue o padrão de acessibilidade com estados visuais.
 */

import type { ComponentProps, ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "../../lib/utils";

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Variantes do botão usando tailwind-variants
 */
export const buttonVariants = tv({
  base: [
    "inline-flex items-center justify-center gap-2 rounded-lg",
    "font-semibold transition-all duration-150 ease-out cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-[0.97] hover:brightness-105",
  ],
  variants: {
    variant: {
      primary: [
        "bg-internoRotas-azul-eletrico text-white shadow-sm",
        "hover:bg-blue-700 focus-visible:ring-blue-500",
      ],
      secondary: [
        "bg-internoRotas-laranja-ambar text-white shadow-sm",
        "hover:bg-orange-600 focus-visible:ring-orange-500",
      ],
      success: [
        "bg-green-600 text-white shadow-sm",
        "hover:bg-green-700 focus-visible:ring-green-500",
      ],
      danger: [
        "bg-red-500 text-white shadow-sm",
        "hover:bg-red-600 focus-visible:ring-red-500",
      ],
      ghost: [
        "bg-transparent text-text-primary",
        "hover:bg-card-hover focus-visible:ring-card-border",
      ],
      outline: [
        "border border-card-border bg-transparent text-text-primary",
        "hover:bg-card-hover focus-visible:ring-card-border",
      ],
      link: [
        "bg-transparent text-internoRotas-azul-eletrico underline-offset-4",
        "hover:underline focus-visible:ring-blue-500",
      ],
    },
    size: {
      xs: "h-7 px-2 text-xs",
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-6 text-base",
      xl: "h-12 px-8 text-lg",
      icon: "size-10",
      "icon-sm": "size-8",
      "icon-xs": "size-6",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    fullWidth: false,
  },
});

// ============================================================================
// TYPES
// ============================================================================

export interface ButtonProps
  extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  /** Ícone à esquerda do texto */
  leftIcon?: ReactNode;
  /** Ícone à direita do texto */
  rightIcon?: ReactNode;
  /** Estado de carregamento */
  loading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Componente de botão com múltiplas variantes e estados.
 *
 * @example
 * ```tsx
 * // Botão primário
 * <Button variant="primary" onClick={handleClick}>
 *   Confirmar
 * </Button>
 *
 * // Botão com ícone
 * <Button variant="ghost" size="icon" aria-label="Menu">
 *   <Menu size={20} />
 * </Button>
 *
 * // Botão com loading
 * <Button loading disabled>
 *   Salvando...
 * </Button>
 * ```
 */
export function Button({
  children,
  className,
  variant,
  size,
  fullWidth,
  leftIcon,
  rightIcon,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      data-slot="button"
      data-loading={loading || undefined}
      data-disabled={isDisabled || undefined}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span
          data-slot="spinner"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : leftIcon ? (
        <span data-slot="left-icon" className="shrink-0">
          {leftIcon}
        </span>
      ) : null}

      {children && <span data-slot="label">{children}</span>}

      {rightIcon && !loading && (
        <span data-slot="right-icon" className="shrink-0">
          {rightIcon}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Grupo de botões com espaçamento consistente
 */
export interface ButtonGroupProps extends ComponentProps<"div"> {
  /** Orientação do grupo */
  orientation?: "horizontal" | "vertical";
  /** Espaçamento entre botões */
  gap?: "sm" | "md" | "lg";
}

export const buttonGroupVariants = tv({
  base: "flex",
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
    gap: {
      sm: "gap-1",
      md: "gap-2",
      lg: "gap-3",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    gap: "md",
  },
});

export function ButtonGroup({
  children,
  className,
  orientation,
  gap,
  ...props
}: ButtonGroupProps) {
  return (
    <div
      data-slot="button-group"
      className={cn(buttonGroupVariants({ orientation, gap }), className)}
      role="group"
      {...props}
    >
      {children}
    </div>
  );
}
