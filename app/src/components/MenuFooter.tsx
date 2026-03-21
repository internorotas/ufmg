/**
 * MenuFooter - Rodapé do menu lateral
 * Design System - Interno Rotas UFMG
 */

import { Heart } from 'lucide-react';
import type { ComponentProps } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { useExternalLinkTracking } from '../hooks/useAnalytics';
import { cn } from '../lib/utils';

/**
 * Variantes do container do footer
 */
export const footerContainerVariants = tv({
  base: ['shrink-0 space-y-2 border-t p-2', 'border-card-border bg-background-secondary'],
});

/**
 * Variantes dos botões do footer
 */
export const footerButtonVariants = tv({
  base: [
    'flex w-full items-center justify-center rounded-md px-2 py-1.5',
    'text-[10px] font-semibold transition-colors cursor-pointer',
  ],
  variants: {
    intent: {
      danger: 'bg-red-500 text-white hover:bg-red-600',
      primary: 'bg-internoRotas-azul-eletrico text-white hover:bg-blue-700',
      ghost: [
        'border border-card-border bg-card text-text-secondary',
        'hover:bg-card-hover hover:text-text-primary',
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
  const { trackExternalLink } = useExternalLinkTracking();

  const handleLinkClick = (label: string, url: string) => {
    trackExternalLink(url, label);
  };

  return (
    <div data-slot="footer" className={cn(footerContainerVariants(), className)} {...props}>
      <div className="flex flex-row gap-1.5">
        {/* Botão Reportar Problema */}
        <a
          href="https://forms.gle/5e9MHq9pp1p8T5Px5"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleLinkClick('Contato', 'https://forms.gle/5e9MHq9pp1p8T5Px5')}
          className={footerButtonVariants({ intent: 'danger' })}
        >
          Contato
        </a>

        {/* Botão Sobre o Projeto */}
        <a
          href="https://github.com/internorotas/ufmg"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleLinkClick('Sobre o Projeto', 'https://github.com/internorotas/ufmg')}
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
        onClick={() => handleLinkClick('Dev Profile', 'https://github.com/igormartins4')}
        className={creditLinkVariants()}
      >
        Desenvolvido com{' '}
        <Heart size={14} fill="currentColor" className="text-internoRotas-azul-eletrico" /> por Igor
        Martins
      </a>
    </div>
  );
}
