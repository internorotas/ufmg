/**
 * VacationBanner - Banner de férias e recessos
 * Design System - Interno Rotas UFMG
 */

import { Info } from 'lucide-react';
import type { ComponentProps } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { getCurrentSpecialPeriod, isWeekday } from '../config/specialPeriods';
import { cn } from '../lib/utils';

/**
 * Variantes do banner de férias
 */
export const vacationBannerVariants = tv({
  base: [
    'flex items-start gap-2 rounded-lg border p-3',
    'mb-3',
    'border-warning-border bg-warning-bg text-warning-text',
  ],
});

export interface VacationBannerProps
  extends ComponentProps<'div'>,
    VariantProps<typeof vacationBannerVariants> {}

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
    <div
      data-slot="banner"
      data-intent="warning"
      className={cn(vacationBannerVariants(), className)}
      {...props}
    >
      <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="text-xs leading-relaxed lg:text-sm">
        <p className="mb-1 font-bold">{specialPeriod.name}</p>
        <p>
          De {specialPeriod.startDate.toLocaleDateString('pt-BR')} a{' '}
          {specialPeriod.endDate.toLocaleDateString('pt-BR')}, operam apenas os horários de Férias e
          Recessos. Não há circulação aos fins de semana e feriados.
        </p>
        {!isWeekdayToday && (
          <p className="mt-2 font-semibold">
            <span role="img" aria-label="Atenção">
              ⚠️
            </span>{' '}
            Hoje não há circulação de ônibus (apenas em dias úteis).
          </p>
        )}
      </div>
    </div>
  );
}
