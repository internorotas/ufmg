/**
 * Skeleton - Componente de loading placeholder
 * Design System - Interno Rotas UFMG
 *
 * @description Skeleton screens para carregamento de conteúdo.
 * Melhora a UX ao mostrar onde o conteúdo será carregado.
 */

import type { ComponentProps } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '../../lib/utils';

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Variantes do skeleton base
 */
export const skeletonVariants = tv({
  base: ['animate-pulse rounded bg-card-border'],
  variants: {
    variant: {
      default: 'bg-card-border',
      darker: 'bg-neutral-border',
      lighter: 'bg-card-hover',
    },
    rounded: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    rounded: 'md',
  },
});

// ============================================================================
// TYPES
// ============================================================================

export interface SkeletonProps
  extends ComponentProps<'div'>,
    VariantProps<typeof skeletonVariants> {
  /** Largura do skeleton */
  width?: string | number;
  /** Altura do skeleton */
  height?: string | number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Skeleton base para loading states
 *
 * @example
 * ```tsx
 * <Skeleton width={200} height={20} />
 * <Skeleton className="h-4 w-full" />
 * ```
 */
export function Skeleton({
  className,
  variant,
  rounded,
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ variant, rounded }), className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

// ============================================================================
// PRESET SKELETONS
// ============================================================================

/**
 * Skeleton para texto
 */
export interface SkeletonTextProps extends Omit<SkeletonProps, 'height'> {
  /** Número de linhas */
  lines?: number;
  /** Última linha mais curta */
  lastLineWidth?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = '75%',
  className,
  ...props
}: SkeletonTextProps) {
  return (
    <div data-slot="skeleton-text" className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 ? lastLineWidth : '100%',
          }}
          {...props}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton para avatar/imagem circular
 */
export interface SkeletonAvatarProps extends Omit<SkeletonProps, 'rounded'> {
  /** Tamanho do avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const avatarSizes = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-12',
  xl: 'size-16',
};

export function SkeletonAvatar({ size = 'md', className, ...props }: SkeletonAvatarProps) {
  return (
    <Skeleton
      data-slot="skeleton-avatar"
      rounded="full"
      className={cn(avatarSizes[size], className)}
      {...props}
    />
  );
}

/**
 * Skeleton para card de linha de ônibus
 */
export function SkeletonLineCard({ className }: { className?: string }) {
  return (
    <div
      data-slot="skeleton-line-card"
      className={cn('rounded-xl border border-card-border bg-card p-4', className)}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="size-12" rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20" rounded="full" />
      </div>

      {/* Schedule info */}
      <div className="mb-4 flex justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-12" />
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="ml-auto h-3 w-16" />
          <Skeleton className="ml-auto h-6 w-12" />
        </div>
      </div>

      {/* Button */}
      <Skeleton className="h-10 w-full" rounded="lg" />
    </div>
  );
}

/**
 * Skeleton para lista de linhas
 */
export function SkeletonLineList({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div data-slot="skeleton-line-list" className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLineCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton para o mapa
 */
export function SkeletonMap({ className }: { className?: string }) {
  return (
    <div
      data-slot="skeleton-map"
      className={cn(
        'relative flex h-full w-full items-center justify-center',
        'bg-card-hover',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Map icon placeholder */}
        <div className="relative">
          <Skeleton className="size-16" rounded="xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="size-8 text-text-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-4 w-32" />
          <Skeleton className="mx-auto h-3 w-24" />
        </div>

        {/* Loading dots animation */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-2 animate-bounce rounded-full bg-internoRotas-azul-eletrico"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para menu lateral
 */
export function SkeletonSidebar({ className }: { className?: string }) {
  return (
    <div data-slot="skeleton-sidebar" className={cn('flex h-full flex-col p-4', className)}>
      {/* Logo */}
      <Skeleton className="mb-6 h-10 w-40" rounded="lg" />

      {/* Search */}
      <Skeleton className="mb-4 h-10 w-full" rounded="lg" />

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-8 flex-1" rounded="lg" />
        <Skeleton className="h-8 flex-1" rounded="lg" />
        <Skeleton className="h-8 flex-1" rounded="lg" />
      </div>

      {/* Lines list */}
      <div className="flex-1 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLineCard key={i} />
        ))}
      </div>
    </div>
  );
}
