/**
 * Badge - Componente de badge/tag
 * Design System - Interno Rotas UFMG
 *
 * @description Badge para status, categorias e labels.
 * Suporta múltiplas variantes e tamanhos.
 */

import type { ComponentProps, ReactNode } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '../../lib/utils';

/**
 * Variantes do badge usando tailwind-variants
 */
export const badgeVariants = tv({
  base: [
    'inline-flex items-center justify-center gap-1 rounded-full',
    'font-semibold whitespace-nowrap border',
    'transition-colors duration-150',
  ],
  variants: {
    variant: {
      // Status badges
      success: ['bg-success-bg text-success-text border-success-border'],
      info: ['bg-info-bg text-info-text border-info-border'],
      warning: ['bg-warning-bg text-warning-text border-warning-border'],
      danger: ['bg-warning-bg text-warning-text border-warning-border'],
      neutral: ['bg-neutral-bg text-neutral-text border-neutral-border'],

      // Brand badges
      primary: [
        'bg-internoRotas-azul-eletrico/20 text-internoRotas-azul-eletrico',
        'border-internoRotas-azul-eletrico/30',
      ],
      secondary: ['bg-warning-bg text-warning-text', 'border-warning-border'],

      // Minimal badges
      outline: ['bg-transparent text-text-secondary border-card-border'],
      ghost: ['bg-card-hover text-text-secondary border-transparent'],
    },
    size: {
      xs: 'h-5 px-1.5 text-[10px]',
      sm: 'h-6 px-2 text-xs',
      md: 'h-7 px-2.5 text-sm',
      lg: 'h-8 px-3 text-sm',
    },
    clickable: {
      true: 'cursor-pointer hover:opacity-80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'neutral',
    size: 'sm',
    clickable: false,
  },
});

/** Props comuns a <span> e <button> para o Badge */
type SharedHTMLProps = Omit<ComponentProps<'span'> & ComponentProps<'button'>, 'children'>;

export interface BadgeProps extends SharedHTMLProps, VariantProps<typeof badgeVariants> {
  /** Ícone à esquerda */
  leftIcon?: ReactNode;
  /** Ícone à direita */
  rightIcon?: ReactNode;
  /** Conteúdo do badge */
  children: ReactNode;
}

/**
 * Componente de badge para status e labels
 *
 * @example
 * ```tsx
 * // Badge de status
 * <Badge variant="success">Circulando</Badge>
 *
 * // Badge com ícone
 * <Badge variant="info" leftIcon={<Clock size={12} />}>
 *   10:30
 * </Badge>
 *
 * // Badge clicável
 * <Badge variant="primary" clickable onClick={handleClick}>
 *   Dias Úteis
 * </Badge>
 * ```
 */
export function Badge({
  children,
  className,
  variant,
  size,
  clickable,
  leftIcon,
  rightIcon,
  onClick,
  ...props
}: BadgeProps) {
  const inner = (
    <>
      {leftIcon && (
        <span data-slot="badge-left-icon" className="shrink-0">
          {leftIcon}
        </span>
      )}
      {children}
      {rightIcon && (
        <span data-slot="badge-right-icon" className="shrink-0">
          {rightIcon}
        </span>
      )}
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        data-slot="badge"
        data-variant={variant}
        onClick={onClick}
        className={cn(badgeVariants({ variant, size, clickable }), className)}
        {...(props as ComponentProps<'button'>)}
      >
        {inner}
      </button>
    );
  }

  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size, clickable }), className)}
      {...props}
    >
      {inner}
    </span>
  );
}

// PRESET BADGES

/**
 * Badge de status de operação da linha
 */
export type LineStatusType = 'running' | 'upcoming' | 'closed' | 'notRunning';

export interface LineStatusBadgeProps {
  /** Status da linha */
  status: LineStatusType;
  /** Texto personalizado */
  label?: string;
  /** Tamanho do badge */
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const lineStatusConfig: Record<
  LineStatusType,
  { variant: BadgeProps['variant']; defaultLabel: string }
> = {
  running: { variant: 'info', defaultLabel: 'Circulando' },
  upcoming: { variant: 'success', defaultLabel: 'Em breve' },
  closed: { variant: 'neutral', defaultLabel: 'Encerrado' },
  notRunning: { variant: 'danger', defaultLabel: 'Não circula' },
};

export function LineStatusBadge({ status, label, size = 'sm' }: LineStatusBadgeProps) {
  const config = lineStatusConfig[status];

  return (
    <Badge variant={config.variant} size={size}>
      {label || config.defaultLabel}
    </Badge>
  );
}

/**
 * Badge de categoria de dia
 */
export type DayCategoryType = 'diasUteis' | 'sabados' | 'domingosFeriados' | 'feriasRecessos';

export interface DayCategoryBadgeProps {
  /** Categoria do dia */
  category: DayCategoryType;
  /** Tamanho do badge */
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const dayCategoryConfig: Record<
  DayCategoryType,
  { variant: BadgeProps['variant']; label: string }
> = {
  diasUteis: { variant: 'primary', label: 'Dias Úteis' },
  sabados: { variant: 'secondary', label: 'Sábados' },
  domingosFeriados: { variant: 'info', label: 'Dom/Feriados' },
  feriasRecessos: { variant: 'warning', label: 'Férias' },
};

export function DayCategoryBadge({ category, size = 'sm' }: DayCategoryBadgeProps) {
  const config = dayCategoryConfig[category];

  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
}

/**
 * Badge de contagem (número de linhas, paradas, etc)
 */
export interface CountBadgeProps {
  /** Número a exibir */
  count: number;
  /** Tamanho do badge */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Variante visual */
  variant?: BadgeProps['variant'];
}

export function CountBadge({ count, size = 'xs', variant = 'neutral' }: CountBadgeProps) {
  return (
    <Badge variant={variant} size={size}>
      {count}
    </Badge>
  );
}
