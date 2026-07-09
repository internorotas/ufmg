/**
 * InfoBanner - Banner informativo
 * Design System - Interno Rotas UFMG
 */

import { Info } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Trans } from 'react-i18next';
import { SystemBanner } from './SystemBanner';

export interface InfoBannerProps extends ComponentProps<'div'> {
  onDismiss?: () => void;
}

/**
 * Banner informativo sobre a saída dos ônibus.
 *
 * @example
 * ```tsx
 * <InfoBanner onDismiss={() => ...} />
 * ```
 */
export function InfoBanner({ className, onDismiss, ...props }: InfoBannerProps) {
  return (
    <SystemBanner
      variant="info"
      className={className}
      icon={<Info aria-hidden="true" />}
      onDismiss={onDismiss}
      description={
        <Trans i18nKey="info.description" ns="system-banner" components={{ strong: <strong /> }} />
      }
      {...props}
    />
  );
}
