/**
 * VacationBanner - Banner de férias e recessos
 * Design System - Interno Rotas UFMG
 */

import { Info } from 'lucide-react';
import type { ComponentProps } from 'react';
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
            De {specialPeriod.startDate.toLocaleDateString('pt-BR')} a{' '}
            {specialPeriod.endDate.toLocaleDateString('pt-BR')}, operam apenas os horários de Férias
            e Recessos. Não há circulação aos fins de semana e feriados.
          </p>
          {!isWeekdayToday && (
            <p className="mt-2 font-semibold">
              <span role="img" aria-label="Atenção">
                ⚠️
              </span>{' '}
              Hoje não há circulação de ônibus (apenas em dias úteis).
            </p>
          )}
        </>
      }
      {...props}
    />
  );
}
