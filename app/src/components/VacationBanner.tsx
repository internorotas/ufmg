/**
 * VacationBanner - Banner de férias e recessos
 * Design System - Interno Rotas UFMG
 */

import { Info } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentSpecialPeriod, isWeekday } from '../config/specialPeriods';
import { SystemBanner } from './SystemBanner';

export interface VacationBannerProps extends ComponentProps<'div'> {}

/**
 * Banner informativo durante períodos de férias e recessos.
 * Só aparece quando há um período especial ativo.
 *
 * @example
 * ```tsx
 * <VacationBanner />
 * ```
 */
export function VacationBanner({ className, ...props }: VacationBannerProps) {
  const { t } = useTranslation('system-banner');
  const specialPeriod = getCurrentSpecialPeriod();

  // Não mostrar se não houver período especial ativo
  if (!specialPeriod) {
    return null;
  }

  const isWeekdayToday = isWeekday();

  return (
    <SystemBanner
      variant="warning"
      className={className}
      icon={<Info aria-hidden="true" />}
      title={specialPeriod.name}
      description={
        <>
          <p>
            {t('vacation.description', {
              start: specialPeriod.startDate.toLocaleDateString('pt-BR'),
              end: specialPeriod.endDate.toLocaleDateString('pt-BR'),
            })}
          </p>
          {!isWeekdayToday && <p className="mt-2 font-semibold">{t('vacation.weekendWarning')}</p>}
        </>
      }
      {...props}
    />
  );
}
