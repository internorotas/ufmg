import { CalendarDays } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import type { SpecialPeriod } from '../config/specialPeriods';
import { SystemBanner } from './SystemBanner';

export interface CalendarBannerProps extends ComponentProps<'div'> {
  period: SpecialPeriod;
  onDismiss?: () => void;
}

function holidayTitle(name: string): string {
  return name.replace(/^Feriado(?: em [^:]+)?:\s*/i, '');
}

export function CalendarBanner({ period, className, onDismiss }: CalendarBannerProps) {
  const { t } = useTranslation('system-banner');
  const end = period.endDate.toLocaleDateString('pt-BR');

  if (period.tipo === 'feriado') {
    return (
      <SystemBanner
        variant="warning"
        className={className}
        icon={<CalendarDays aria-hidden="true" />}
        title={holidayTitle(period.name)}
        description={t('calendar.holiday')}
        onDismiss={onDismiss}
      />
    );
  }

  return (
    <SystemBanner
      variant="warning"
      className={className}
      icon={<CalendarDays aria-hidden="true" />}
      title={t(period.tipo === 'recesso' ? 'calendar.recessTitle' : 'calendar.vacationTitle')}
      description={t('calendar.academicPeriod', { end })}
      onDismiss={onDismiss}
    />
  );
}
