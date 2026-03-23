/**
 * HorariosModal - Modal de horários da linha
 * Design System - Interno Rotas UFMG
 */

import { CheckCircle, Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { tv } from 'tailwind-variants';
import { findScheduleIndex, timeToMinutes } from '../../lib/utils';
import { useAnalytics } from '../hooks/useAnalytics';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { obterStatusLinha } from '../lib/utils';
import type { Linha } from '../types/data.types';
import { Modal } from './Modal';

/**
 * Variantes do card de horário
 */
export const scheduleCardVariants = tv({
  base: 'rounded-lg border p-3 text-center transition-all',
  variants: {
    status: {
      upcoming: ['border-success-border bg-success-bg'],
      passed: 'border-card-border bg-card/50 opacity-50',
    },
  },
  defaultVariants: {
    status: 'upcoming',
  },
});

/**
 * Variantes do texto de horário
 */
export const scheduleTimeVariants = tv({
  base: 'font-bold',
  variants: {
    status: {
      upcoming: 'text-xl text-success-text',
      passed: 'text-lg text-text-secondary',
    },
  },
  defaultVariants: {
    status: 'upcoming',
  },
});

/**
 * Variantes do alerta de suspensão
 */
export const suspensionAlertVariants = tv({
  base: ['rounded-lg border p-4 text-center', 'border-warning-border bg-warning-bg'],
});

export interface HorariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  linha: Linha;
}

type ScheduleTab = 'diasUteis' | 'sabados' | 'domingos';

function getInitialTab(): ScheduleTab {
  const day = new Date().getDay();
  if (day === 6) return 'sabados';
  if (day === 0) return 'domingos';
  return 'diasUteis';
}

function getHorariosByTab(linha: Linha, tab: ScheduleTab): string[] {
  const horariosRaw = linha.horarios as unknown;

  if (Array.isArray(horariosRaw)) {
    return horariosRaw;
  }

  if (!horariosRaw || typeof horariosRaw !== 'object') {
    return [];
  }

  const horariosPorDia = horariosRaw as Partial<Record<ScheduleTab, string[]>>;
  return Array.isArray(horariosPorDia[tab]) ? horariosPorDia[tab] : [];
}

/**
 * Modal que exibe os horários de uma linha de ônibus.
 *
 * @example
 * ```tsx
 * <HorariosModal
 *   isOpen={true}
 *   onClose={() => setOpen(false)}
 *   linha={linhaData}
 * />
 * ```
 */
export function HorariosModal({ isOpen, onClose, linha }: HorariosModalProps) {
  const analytics = useAnalytics();
  const { trackPageView } = analytics;
  const [activeTab, setActiveTab] = useState<ScheduleTab>(() => getInitialTab());
  const now = useCurrentTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const baseHorarios = useMemo(() => {
    const horariosDoDia = getHorariosByTab(linha, activeTab);

    return horariosDoDia
      .filter((time) => time?.includes(':'))
      .map((horario) => ({
        horario,
        minutos: timeToMinutes(horario),
      }))
      .sort((a, b) => a.minutos - b.minutos);
  }, [activeTab, linha]);

  const schedulesInMinutes = useMemo(() => baseHorarios.map((h) => h.minutos), [baseHorarios]);
  const statusLinha = obterStatusLinha(linha, now, schedulesInMinutes);

  const shouldDisableSchedules = statusLinha.id === 'NAO_CIRCULA_HOJE';

  const splitIndex = useMemo(() => {
    return findScheduleIndex(baseHorarios, currentMinutes - 1, (h) => h.minutos);
  }, [baseHorarios, currentMinutes]);

  const passados = baseHorarios.slice(0, splitIndex);
  const proximos = baseHorarios.slice(splitIndex);
  const todos = baseHorarios;

  useEffect(() => {
    if (!isOpen) return;

    trackPageView(`/modal/horarios/${linha.idRota}`);

    analytics.trackEvent({
      category: 'engagement',
      action: 'view_schedule',
      label: `${linha.nome} | status=${statusLinha.id}`,
      value: todos.length,
    });

    analytics.trackEvent({
      category: 'engagement',
      action: 'schedule_distribution',
      label: `linha=${linha.nome};proximos=${proximos.length};passados=${passados.length};total=${todos.length}`,
      value: proximos.length,
    });
  }, [
    isOpen,
    linha.idRota,
    linha.nome,
    passados.length,
    proximos.length,
    statusLinha.id,
    todos.length,
    analytics,
    trackPageView,
  ]);

  const handleTabChange = (tab: ScheduleTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    analytics.trackEvent({
      category: 'navigation',
      action: 'change_schedule_tab',
      label: `${linha.nome}:${tab}`,
    });
  };

  const handleClose = () => {
    analytics.trackEvent({
      category: 'navigation',
      action: 'close_schedule_modal',
      label: linha.nome,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Horários - ${linha.nome}`} size="md">
      <div className="space-y-6">
        <div className="flex gap-2 rounded-lg bg-internoRotas-cinza-grafite p-1">
          <button
            type="button"
            onClick={() => handleTabChange('diasUteis')}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold ${activeTab === 'diasUteis' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-card-hover'}`}
          >
            Dias Úteis
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('sabados')}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold ${activeTab === 'sabados' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-card-hover'}`}
          >
            Sábado
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('domingos')}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold ${activeTab === 'domingos' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-card-hover'}`}
          >
            Domingo
          </button>
        </div>

        {shouldDisableSchedules ? (
          <div data-slot="all-schedules">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-secondary">
              <Clock size={20} />
              Todos os Horários
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {todos.map(({ horario }) => (
                <div
                  key={`horario-${horario}`}
                  className={scheduleCardVariants({ status: 'passed' })}
                >
                  <span className="sr-only">Horário às {horario}</span>
                  <p className={scheduleTimeVariants({ status: 'passed' })} aria-hidden="true">
                    {horario}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {proximos.length > 0 && (
              <div data-slot="upcoming-schedules">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  <Clock className="text-success-text" size={20} />
                  Próximos Horários
                </h3>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {proximos.map(({ horario }) => (
                    <div
                      key={`proximo-${horario}`}
                      className={scheduleCardVariants({ status: 'upcoming' })}
                    >
                      <span className="sr-only">Próximo horário às {horario}</span>
                      <p
                        className={scheduleTimeVariants({ status: 'upcoming' })}
                        aria-hidden="true"
                      >
                        {horario}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {passados.length > 0 && (
              <div data-slot="passed-schedules">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  <CheckCircle className="text-text-tertiary" size={20} />
                  Horários Passados
                </h3>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {passados.map(({ horario }) => (
                    <div
                      key={`passado-${horario}`}
                      className={scheduleCardVariants({ status: 'passed' })}
                    >
                      <span className="sr-only">Horário passado às {horario}</span>
                      <p className={scheduleTimeVariants({ status: 'passed' })} aria-hidden="true">
                        {horario}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div data-slot="summary" className="rounded-lg bg-internoRotas-cinza-grafite p-4 text-sm">
          <p className="text-center text-text-secondary">
            {shouldDisableSchedules
              ? `Total de ${todos.length} horários`
              : `Total de ${todos.length} horários • ${proximos.length} restantes`}
          </p>
        </div>
      </div>
    </Modal>
  );
}
