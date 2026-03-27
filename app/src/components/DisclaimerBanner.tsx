/**
 * DisclaimerBanner - Banner de aviso com contatos
 * Design System - Interno Rotas UFMG
 */

import { AlertTriangle, Mail, Phone } from 'lucide-react';
import type { ComponentProps } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '../lib/utils';

/**
 * Variantes do banner de disclaimer
 */
export const disclaimerBannerVariants = tv({
  base: ['rounded-lg border p-3', 'mb-3', 'border-warning-border bg-warning-bg text-warning-text'],
});

/**
 * Variantes do botão de contato
 */
export const contactButtonVariants = tv({
  base: [
    'flex items-center justify-center gap-2 rounded-lg border px-3 py-2',
    'text-xs font-semibold transition-opacity cursor-pointer',
    'border-warning-border bg-warning-bg text-warning-text',
    'hover:opacity-80',
  ],
});

export interface DisclaimerBannerProps
  extends ComponentProps<'div'>,
    VariantProps<typeof disclaimerBannerVariants> {
  isOffline?: boolean;
}

/**
 * Banner de aviso com informações de contato da Divisão de Transportes.
 *
 * @example
 * ```tsx
 * <DisclaimerBanner />
 * ```
 */
export function DisclaimerBanner({
  className,
  isOffline = false,
  ...props
}: DisclaimerBannerProps) {
  return (
    <div
      data-slot="banner"
      data-intent="warning"
      className={cn(disclaimerBannerVariants(), className)}
      {...props}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4.5 shrink-0" />
        <div className="flex-1">
          {isOffline && (
            <p className="mb-2 text-xs font-semibold leading-relaxed">
              Conexão perdida. Mapas podem não carregar, mas previsões estáticas continuam
              funcionando.
            </p>
          )}
          <p className="mb-2 text-xs leading-relaxed">
            Informações extraídas do{' '}
            <a
              href="https://www.ufmg.br/transporte/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline hover:no-underline"
            >
              site da UFMG
            </a>
            .
          </p>
          <p className="mb-2 text-xs leading-relaxed">
            Podem haver mudanças de itinerário e horários sem prévio aviso. Para informações,
            reclamações, dúvidas e sugestões, entre em contato com a{' '}
            <strong>Divisão de Transportes</strong>.
          </p>

          <div className="mt-2 flex flex-col gap-2 border-t border-warning-border pt-2 lg:grid lg:grid-cols-2">
            <a href="tel:3409-4601" className={contactButtonVariants()}>
              <Phone className="size-4 shrink-0" />
              <span>3409-4601 / 4606</span>
            </a>
            <a href="mailto:sfrota@dsg.ufmg.br" className={contactButtonVariants()}>
              <Mail className="size-4 shrink-0" />
              <span>sfrota@dsg.ufmg.br</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
