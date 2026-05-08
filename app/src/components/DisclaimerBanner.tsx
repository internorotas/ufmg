/**
 * DisclaimerBanner - Banner de aviso com contatos
 * Design System - Interno Rotas UFMG
 */

import { AlertTriangle, Mail, Phone } from 'lucide-react';
import type { ComponentProps } from 'react';
import { tv } from 'tailwind-variants';
import { SystemBanner } from './SystemBanner';

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

export interface DisclaimerBannerProps extends ComponentProps<'div'> {
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
    <SystemBanner
      variant="warning"
      className={className}
      icon={<AlertTriangle className="size-4.5" aria-hidden="true" />}
      description={
        <>
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
        </>
      }
      actions={
        <>
          <a
            href="tel:3409-4601"
            className={contactButtonVariants()}
            aria-label="Ligar para a Divisão de Transportes: 3409-4601 ou 4606"
          >
            <Phone className="size-4 shrink-0" aria-hidden="true" />
            <span>3409-4601 / 4606</span>
          </a>
          <a
            href="mailto:sfrota@dsg.ufmg.br"
            className={contactButtonVariants()}
            aria-label="Enviar e-mail para sfrota@dsg.ufmg.br"
          >
            <Mail className="size-4 shrink-0" aria-hidden="true" />
            <span>sfrota@dsg.ufmg.br</span>
          </a>
        </>
      }
      {...props}
    />
  );
}
