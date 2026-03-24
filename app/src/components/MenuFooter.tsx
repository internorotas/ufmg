/**
 * MenuFooter - Rodapé do menu lateral
 * Design System - Interno Rotas UFMG
 */

import { Heart } from 'lucide-react';
import type { ComponentProps } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { useAnalytics } from '../hooks/useAnalytics';
import { cn } from '../lib/utils';

/**
 * Variantes do container do footer
 */
export const footerContainerVariants = tv({
  base: ['shrink-0 space-y-2 border-t p-2', 'border-card-border bg-sidebar transition-colors'],
});

/**
 * Variantes dos botões do footer
 */
export const footerButtonVariants = tv({
  base: [
    'flex w-full items-center justify-center rounded-md px-2 py-1.5',
    'text-xs font-semibold transition-colors cursor-pointer',
  ],
  variants: {
    intent: {
      danger: 'bg-red-600 text-white hover:bg-red-700',
      primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
      ghost: [
        'border border-card-border bg-background text-text-primary',
        'hover:bg-background-secondary hover:text-text-primary',
      ],
    },
  },
  defaultVariants: {
    intent: 'ghost',
  },
});

/**
 * Variantes do link de crédito
 */
export const creditLinkVariants = tv({
  base: [
    'flex w-full items-center justify-center gap-1.5 py-2 cursor-pointer',
    'text-xs font-bold text-text-secondary transition-colors',
    'hover:text-text-primary',
  ],
});

export interface MenuFooterProps
  extends ComponentProps<'div'>,
    VariantProps<typeof footerContainerVariants> {}

/**
 * Menu de rodapé com links para contato, projeto e créditos.
 *
 * @example
 * ```tsx
 * <MenuFooter />
 * ```
 */
export function MenuFooter({ className, ...props }: MenuFooterProps) {
  const analytics = useAnalytics();

  const handleLinkClick = (platform: string) => {
    analytics.trackEvent({
      category: 'navigation',
      action: 'click_outbound_link',
      label: platform,
    });
  };

  return (
    <div data-slot="footer" className={cn(footerContainerVariants(), className)} {...props}>
      <div className="flex flex-row gap-1.5">
        {/* Botão Reportar Problema */}
        <a
          href="https://forms.gle/5e9MHq9pp1p8T5Px5"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleLinkClick('Contato')}
          className={footerButtonVariants({ intent: 'danger' })}
        >
          Contato
        </a>

        {/* Botão Sobre o Projeto */}
        <a
          href="https://github.com/internorotas/ufmg"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleLinkClick('Sobre o Projeto')}
          className={footerButtonVariants({ intent: 'primary' })}
        >
          Sobre
        </a>

        {/* Botão Versão Antiga */}
        {/* <a
          href="https://ufmg-pi.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            handleLinkClick("Versão Antiga", "https://ufmg-pi.vercel.app/")
          }
          className={footerButtonVariants({ intent: "ghost" })}
        >
          Versão Antiga
        </a> */}
      </div>

      {/* Desenvolvido por */}
      <a
        href="https://github.com/igormartins4"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleLinkClick('Dev Profile')}
        className={creditLinkVariants()}
      >
        Desenvolvido com
        <Heart size={14} fill="currentColor" className="text-red-500" />
        por Igor Martins
      </a>
    </div>
  );
}
