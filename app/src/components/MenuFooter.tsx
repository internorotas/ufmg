/**
 * MenuFooter - Rodapé do menu lateral
 * Design System - Interno Rotas UFMG
 */

import { Heart } from 'lucide-react';
import type { ComponentProps } from 'react';

import { tv, type VariantProps } from 'tailwind-variants';

import { useAnalytics } from '../hooks/useAnalytics';
import { cn } from '../lib/utils';
import type { LegalModalType } from '../types/legal.types';

// Obtém a versão do app do ambiente
const appVersion = import.meta.env.VITE_APP_VERSION;

/**
 * Variantes do container do footer
 */
export const footerContainerVariants = tv({
  base: [
    'shrink-0 space-y-2 border-t px-3 py-2 sm:px-4',
    'border-card-border bg-sidebar transition-colors',
    'overflow-x-hidden',
  ],
});

/**
 * Variantes dos botões do footer
 */
export const footerButtonVariants = tv({
  base: [
    'flex min-h-11 w-full items-center justify-center rounded-md border px-2.5 py-2',
    'text-center text-[0.8rem] leading-tight sm:text-sm',
    'text-sm font-semibold transition-colors cursor-pointer',
    'truncate',
  ],
  variants: {
    intent: {
      danger: [
        'border-card-border bg-background text-text-primary',
        'hover:bg-background-secondary hover:text-text-primary',
      ],
      primary: [
        'border-card-border bg-background text-text-primary',
        'hover:bg-background-secondary hover:text-text-primary',
      ],
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
    'flex items-center justify-center gap-1.5 py-1 cursor-pointer',
    'text-xs font-bold text-text-secondary transition-colors',
    'hover:text-text-primary',
  ],
});

export interface MenuFooterProps
  extends Omit<ComponentProps<'div'>, 'onClick'>,
    VariantProps<typeof footerContainerVariants> {
  onOpenLegalModal: (modalType: LegalModalType) => void;
}

/**
 * Menu de rodapé com links para contato, projeto e créditos.
 *
 * @example
 * ```tsx
 * <MenuFooter />
 * ```
 */
export function MenuFooter({ className, onOpenLegalModal, ...props }: MenuFooterProps) {
  const analytics = useAnalytics();

  const handleLinkClick = (platform: string) => {
    analytics.trackEvent({
      category: 'navigation',
      action: 'click_outbound_link',
      label: platform,
    });
  };

  const handleLegalClick = (modalType: LegalModalType, label: string) => {
    handleLinkClick(label);
    onOpenLegalModal(modalType);
  };

  return (
    <div data-slot="footer" className={cn(footerContainerVariants(), className)} {...props}>
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
        {/* Botão Reportar Problema */}
        <a
          href="https://forms.gle/5e9MHq9pp1p8T5Px5"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleLinkClick('Contato')}
          aria-label="Reportar problema ou entrar em contato (abre em nova aba)"
          className={footerButtonVariants({ intent: 'danger' })}
        >
          Contato
        </a>

        {/* Botão Sobre o Projeto */}
        <button
          type="button"
          onClick={() => handleLegalClick('sobre', 'Sobre')}
          aria-label="Abrir modal Sobre o projeto"
          className={footerButtonVariants({ intent: 'primary' })}
        >
          Sobre
        </button>

        <button
          type="button"
          onClick={() => handleLegalClick('privacidade', 'Privacidade')}
          aria-label="Abrir modal Política de privacidade"
          className={footerButtonVariants({ intent: 'ghost' })}
        >
          Privacidade
        </button>

        <button
          type="button"
          onClick={() => handleLegalClick('termos', 'Termos')}
          aria-label="Abrir modal Termos de uso"
          className={footerButtonVariants({ intent: 'ghost' })}
        >
          Termos
        </button>

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
      <div className="flex flex-row flex-wrap items-center justify-center gap-1 text-center">
        <a
          href="https://github.com/igormartins4"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleLinkClick('Dev Profile')}
          aria-label="Perfil do desenvolvedor Igor Martins no GitHub (abre em nova aba)"
          className={creditLinkVariants()}
        >
          Desenvolvido com
          <Heart size={14} fill="currentColor" className="text-red-500" aria-hidden="true" />
          por Igor Martins
        </a>
        {appVersion && (
          <span className="text-xs font-semibold text-text-tertiary"> / v{appVersion}</span>
        )}
      </div>
    </div>
  );
}
