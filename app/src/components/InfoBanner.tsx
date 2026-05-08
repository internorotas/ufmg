/**
 * InfoBanner - Banner informativo
 * Design System - Interno Rotas UFMG
 */

import { Info } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Trans } from 'react-i18next';
import { SystemBanner } from './SystemBanner';

export interface InfoBannerProps extends ComponentProps<'div'> {}

/**
 * Banner informativo sobre a saída dos ônibus.
 *
 * @example
 * ```tsx
 * <InfoBanner />
 * ```
 */
export function InfoBanner({ className, ...props }: InfoBannerProps) {
  return (
    <SystemBanner
      variant="info"
      className={className}
      icon={<Info aria-hidden="true" />}
      description={
        <Trans i18nKey="info.description" ns="system-banner" components={{ strong: <strong /> }} />
      }
      {...props}
    />
  );
}
