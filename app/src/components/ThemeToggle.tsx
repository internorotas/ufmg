/**
 * ThemeToggle - Botão de alternância de tema
 * Design System - Interno Rotas UFMG
 */

import { Moon, Sun } from 'lucide-react';
import type { ComponentProps } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { useTheme } from '../contexts/ThemeContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { cn } from '../lib/utils';

/**
 * Variantes do botão de tema
 */
export const themeToggleVariants = tv({
  base: [
    'inline-flex items-center justify-center rounded-lg p-1 cursor-pointer',
    'transition-all duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    'active:scale-90 hover:scale-105',
  ],
  variants: {
    variant: {
      default: ['bg-background-secondary hover:bg-card', 'dark:bg-card dark:hover:bg-card-hover'],
      ghost: 'hover:bg-card-hover',
    },
    size: {
      sm: 'p-1',
      md: 'p-2',
      lg: 'p-3',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'sm',
  },
});

export interface ThemeToggleProps
  extends Omit<ComponentProps<'button'>, 'children'>,
    VariantProps<typeof themeToggleVariants> {
  /** Tamanho do ícone em pixels */
  iconSize?: number;
}

/**
 * Botão que permite ao usuário alternar entre os temas claro e escuro.
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * <ThemeToggle variant="ghost" size="md" />
 * ```
 */
export function ThemeToggle({
  variant,
  size,
  iconSize = 20,
  className,
  ...props
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const analytics = useAnalytics();

  const isDark = theme === 'dark';

  const handleToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    analytics.trackEvent({
      category: 'preferences',
      action: 'toggle_theme',
      label: newTheme,
    });
    toggleTheme();
  };

  return (
    <button
      data-slot="toggle"
      data-state={isDark ? 'dark' : 'light'}
      onClick={handleToggle}
      className={cn(themeToggleVariants({ variant, size }), className)}
      aria-label={`Alternar para tema ${isDark ? 'claro' : 'escuro'}`}
      title={`Alternar para tema ${isDark ? 'claro' : 'escuro'}`}
      aria-pressed={isDark}
      {...props}
    >
      {isDark ? (
        <Sun size={iconSize} className="text-brand-accent" aria-hidden="true" />
      ) : (
        <Moon size={iconSize} className="text-text-primary" aria-hidden="true" />
      )}
    </button>
  );
}
