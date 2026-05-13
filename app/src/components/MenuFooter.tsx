/**
 * MenuFooter - Rodapé do menu lateral
 * Design System - Interno Rotas UFMG
 */

import { Heart } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';

import { tv, type VariantProps } from 'tailwind-variants';
import { tenantConfig } from '@/tenants/tenantConfig';

import { useAnalytics } from '../hooks/useAnalytics';
import { cn } from '../lib/utils';

// Obtém a versão do app do ambiente
const appVersion = import.meta.env.VITE_APP_VERSION;

/**
 * Variantes do container do footer
 */
export const footerContainerVariants = tv({
  base: [
    'shrink-0 space-y-2 border-t px-4 py-2',
    'border-card-border bg-sidebar transition-colors',
  ],
});

/**
 * Variantes dos botões do footer
 */
export const footerButtonVariants = tv({
  base: [
    'flex w-full items-center justify-center rounded-md border px-3 py-2',
    'text-sm font-semibold transition-colors cursor-pointer',
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

  const handleLinkClick = (
    label: string,
    action: 'click_outbound_link' | 'click_internal_link',
  ) => {
    analytics.trackEvent({
      category: 'navigation',
      action,
      label,
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
          onClick={() => handleLinkClick('Contato', 'click_outbound_link')}
          aria-label="Reportar problema ou entrar em contato (abre em nova aba)"
          className={footerButtonVariants({ intent: 'danger' })}
        >
          Contato
        </a>

        {/* Botão Sobre o Projeto */}
        <Link
          to="/sobre"
          onClick={() => handleLinkClick('Sobre', 'click_internal_link')}
          aria-label="Sobre o projeto no app"
          className={footerButtonVariants({ intent: 'primary' })}
        >
          Sobre
        </Link>

        {tenantConfig.publicRepositoryUrl ? (
          <a
            href={tenantConfig.publicRepositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleLinkClick('Repositório', 'click_outbound_link')}
            aria-label="Abrir repositório público do projeto em nova aba"
            className={footerButtonVariants({ intent: 'ghost' })}
          >
            Código
          </a>
        ) : null}
      </div>

      {/* Desenvolvido por */}
      <div className="flex flex-row flex-wrap items-center justify-center gap-1">
        <a
          href="https://github.com/igormartins4"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleLinkClick('Dev Profile', 'click_outbound_link')}
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
