/**
 * HeaderMobile - Cabeçalho mobile do app
 * Design System - Interno Rotas UFMG
 */

import { Menu, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import logo from '../assets/logo-natal-horizontal.svg';
import { useAnalytics } from '../hooks/useAnalytics';
import { cn } from '../lib/utils';

/**
 * Variantes do header mobile
 */
export const headerMobileVariants = tv({
  base: [
    'fixed left-0 right-0 top-0 z-[1005] md:hidden',
    'flex h-14 items-center justify-between px-4',
    // Glassmorphism effect
    'bg-interno-rotas-primaria/95 backdrop-blur-xl backdrop-saturate-150',
    'shadow-lg border-b border-white/10',
  ],
});

/**
 * Variantes do botão de menu
 */
export const menuButtonVariants = tv({
  base: [
    'rounded-full p-2 text-white transition-colors cursor-pointer',
    'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white',
  ],
});

export interface HeaderMobileProps
  extends Omit<ComponentProps<'header'>, 'children'>,
    VariantProps<typeof headerMobileVariants> {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

/**
 * Cabeçalho mobile com logo e botão de menu.
 *
 * @example
 * ```tsx
 * <HeaderMobile isMenuOpen={false} toggleMenu={() => setIsOpen(!isOpen)} />
 * ```
 */
export function HeaderMobile({ isMenuOpen, toggleMenu, className, ...props }: HeaderMobileProps) {
  const analytics = useAnalytics();

  const handleToggleMenu = () => {
    analytics.trackEvent('toggle_menu', { state: isMenuOpen ? 'close' : 'open' });
    toggleMenu();
  };

  return (
    <header data-slot="header" className={cn(headerMobileVariants(), className)} {...props}>
      <div className="h-8">
        <img src={logo} alt="Logo Interno Rotas" className="h-full" />
      </div>

      <button
        type="button"
        onClick={handleToggleMenu}
        className={menuButtonVariants()}
        aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        title={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? <X className="size-7" /> : <Menu className="size-7" />}
      </button>
    </header>
  );
}
