/**
 * InfoBanner - Banner informativo
 * Design System - Interno Rotas UFMG
 */

import { Info } from 'lucide-react';
import type { ComponentProps } from 'react';
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
        <>
          Todas as rotas iniciam e terminam próximas à <strong>Escola de Música</strong>. Os
          horários indicam a saída dos ônibus deste ponto.
        </>
      }
      {...props}
    />
  );
}
