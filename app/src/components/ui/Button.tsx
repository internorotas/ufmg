/**
 * Button - Componente base de botão
 * Design System - Interno Rotas UFMG
 *
 * @description Botão reutilizável com variantes de estilo e tamanho.
 * Segue o padrão de acessibilidade com estados visuais.
 */

import { type ComponentProps, forwardRef, type ReactNode } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '../../lib/utils';

/**
 * Variantes do botão usando tailwind-variants
 */
export const buttonVariants = tv({
  base: [
    'inline-flex items-center justify-center gap-2 rounded-(--shape-sm)',
    'font-semibold transition-[box-shadow,transform,background-color,border-color] duration-100 ease-out cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  variants: {
    variant: {
      primary: [
        'bg-brand-primary text-text-inverse shadow-(--elevation-1)',
        'hover:shadow-(--elevation-2) hover:brightness-110',
        'active:shadow-none active:scale-[0.98]',
        'focus-visible:ring-brand-primary',
      ],
      secondary: [
        'bg-brand-accent text-text-inverse shadow-(--elevation-1)',
        'hover:shadow-(--elevation-2) hover:brightness-110',
        'active:shadow-none active:scale-[0.98]',
        'focus-visible:ring-brand-accent',
      ],
      success: [
        'bg-success-border text-text-inverse shadow-(--elevation-1)',
        'hover:shadow-(--elevation-2) hover:brightness-110',
        'active:shadow-none active:scale-[0.98]',
        'focus-visible:ring-success-border',
      ],
      danger: [
        'bg-red-600 text-white shadow-(--elevation-1)',
        'hover:shadow-(--elevation-2) hover:brightness-110',
        'active:shadow-none active:scale-[0.98]',
        'focus-visible:ring-red-500',
      ],
      ghost: [
        'bg-transparent text-text-primary border border-transparent',
        'hover:bg-(--state-hover) hover:border-(--card-border)',
        'active:bg-(--state-pressed)',
        'focus-visible:ring-brand-primary',
      ],
      outline: [
        'bg-transparent text-text-primary border border-[var(--card-border)]',
        'hover:bg-(--state-hover) hover:border-brand-primary',
        'active:bg-(--state-pressed)',
        'focus-visible:ring-brand-primary',
      ],
      link: [
        'bg-transparent text-internoRotas-azul-eletrico underline-offset-4 border-transparent',
        'hover:underline',
        'focus-visible:ring-brand-primary',
      ],
    },
    size: {
      xs: 'h-7 px-2 text-xs',
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-6 text-base',
      xl: 'h-12 px-8 text-lg',
      icon: 'size-10',
      'icon-sm': 'size-8',
      'icon-xs': 'size-6',
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
    fullWidth: false,
  },
});

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /** Ícone à esquerda do texto */
  leftIcon?: ReactNode;
  /** Ícone à direita do texto */
  rightIcon?: ReactNode;
  /** Estado de carregamento */
  loading?: boolean;
}

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
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
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
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      data-slot="button"
      data-loading={loading || undefined}
      data-disabled={isDisabled || undefined}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
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
});

Button.displayName = 'Button';

// SUB-COMPONENTS

/**
 * Grupo de botões com espaçamento consistente
 */
export interface ButtonGroupProps extends ComponentProps<'div'> {
  /** Orientação do grupo */
  orientation?: 'horizontal' | 'vertical';
  /** Espaçamento entre botões */
  gap?: 'sm' | 'md' | 'lg';
}

export const buttonGroupVariants = tv({
  base: 'flex',
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
    gap: {
      sm: 'gap-1',
      md: 'gap-2',
      lg: 'gap-3',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    gap: 'md',
  },
});

export function ButtonGroup({ children, className, orientation, gap, ...props }: ButtonGroupProps) {
  return (
    <div
      data-slot="button-group"
      className={cn(buttonGroupVariants({ orientation, gap }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
