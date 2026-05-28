/**
 * DisclaimerBanner - Banner de aviso com contatos
 * Design System - Interno Rotas UFMG
 */

import { AlertTriangle, Mail, Phone } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Trans } from 'react-i18next';
import { tv } from 'tailwind-variants';
import { tenantConfig } from '@/tenants/tenantConfig';
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
  const contactActions =
    tenantConfig.transportContactPhone && tenantConfig.transportContactPhoneHref ? (
      <a
        href={tenantConfig.transportContactPhoneHref}
        className={contactButtonVariants()}
        aria-label={`Ligar para o contato de transportes: ${tenantConfig.transportContactPhone}`}
      >
        <Phone className="size-4 shrink-0" aria-hidden="true" />
        <span>{tenantConfig.transportContactPhone}</span>
      </a>
    ) : null;

  const emailAction = tenantConfig.transportContactEmail ? (
    <a
      href={`mailto:${tenantConfig.transportContactEmail}`}
      className={contactButtonVariants()}
      aria-label={`Enviar e-mail para ${tenantConfig.transportContactEmail}`}
    >
      <Mail className="size-4 shrink-0" aria-hidden="true" />
      <span>{tenantConfig.transportContactEmail}</span>
    </a>
  ) : null;

  return (
    <SystemBanner
      variant="warning"
      className={className}
      icon={<AlertTriangle className="size-4.5" aria-hidden="true" />}
      description={
        <>
          {isOffline && (
            <p className="mb-2 text-xs font-semibold leading-relaxed">
              <Trans i18nKey="disclaimer.offline" ns="system-banner" />
            </p>
          )}
          <p className="mb-2 text-xs leading-relaxed">
            <Trans
              i18nKey="disclaimer.source"
              ns="system-banner"
              components={{
                a: tenantConfig.transportSiteUrl ? (
                  <a
                    href={tenantConfig.transportSiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline hover:no-underline"
                  >
                    site oficial de transportes
                  </a>
                ) : (
                  <span className="font-semibold">canal oficial de transportes</span>
                ),
              }}
            />
          </p>
          <p className="mb-2 text-xs leading-relaxed">
            <Trans
              i18nKey="disclaimer.contact"
              ns="system-banner"
              components={{ strong: <strong /> }}
            />
          </p>
        </>
      }
      actions={
        <>
          {contactActions}
          {emailAction}
        </>
      }
      {...props}
    />
  );
}
