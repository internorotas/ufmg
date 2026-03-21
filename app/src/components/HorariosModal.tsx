/**
 * HorariosModal - Modal de horários da linha
 * Design System - Interno Rotas UFMG
 */

import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { tv } from 'tailwind-variants';
import { findScheduleIndex, timeToMinutes } from '../../lib/utils';
import { useAnalytics } from '../hooks/useAnalytics';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { obterHorariosLinhaNoDia, obterStatusLinha } from '../lib/utils';
import type { Linha } from '../types/data.types';
import { Modal } from './Modal';

/**
 * Variantes do card de horário
 */
export const scheduleCardVariants = tv({
  base: 'rounded-lg border p-3 text-center transition-all',
  variants: {
    status: {
      upcoming: ['border-green-600 bg-green-900/30'],
      passed: 'border-gray-700 bg-gray-800/50 opacity-50',
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
      upcoming: 'text-xl text-green-300',
      passed: 'text-lg text-gray-400',
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
  base: ['rounded-lg border p-4 text-center', 'border-yellow-600 bg-yellow-900/30'],
});

export interface HorariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  linha: Linha;
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
  const { trackEvent } = useAnalytics();
  const now = useCurrentTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const statusLinha = obterStatusLinha(linha, now);

  const shouldDisableSchedules = statusLinha.id === 'NAO_CIRCULA_HOJE';

  const baseHorarios = useMemo(() => {
    const horariosDoDia = obterHorariosLinhaNoDia(linha, now);

    return horariosDoDia
      .filter((time) => time?.includes(':'))
      .map((horario) => ({
        horario,
        minutos: timeToMinutes(horario),
      }))
      .sort((a, b) => a.minutos - b.minutos);
  }, [linha, now]);

  const splitIndex = useMemo(() => {
    return findScheduleIndex(baseHorarios, currentMinutes - 1, (h) => h.minutos);
  }, [baseHorarios, currentMinutes]);

  const passados = baseHorarios.slice(0, splitIndex);
  const proximos = baseHorarios.slice(splitIndex);
  const todos = baseHorarios;

  useEffect(() => {
    if (!isOpen) return;

    trackEvent({
      category: 'Horarios',
      action: 'Abrir Modal Horarios',
      label: `${linha.nome} | status=${statusLinha.id}`,
      value: todos.length,
    });

    trackEvent({
      category: 'Horarios',
      action: 'Distribuicao Horarios',
      label: `linha=${linha.nome};proximos=${proximos.length};passados=${passados.length};total=${todos.length}`,
      value: proximos.length,
    });
  }, [
    isOpen,
    linha.nome,
    passados.length,
    proximos.length,
    statusLinha.id,
    todos.length,
    trackEvent,
  ]);

  const handleClose = () => {
    trackEvent({
      category: 'Horarios',
      action: 'Fechar Modal Horarios',
      label: linha.nome,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Horários - ${linha.nome}`} size="md">
      <div className="space-y-6">
        {shouldDisableSchedules && (
          <div data-slot="suspension-alert" className={suspensionAlertVariants()}>
            <p className="mb-2 font-semibold text-yellow-300">
              <AlertTriangle className="mr-1 inline size-4" />
              Linha sem operação hoje
            </p>
            <p className="text-sm text-yellow-200">{statusLinha.texto}</p>
          </div>
        )}

        {!shouldDisableSchedules && proximos.length > 0 && (
          <div data-slot="upcoming-schedules">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Clock className="text-green-400" size={20} />
              Próximos Horários
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {proximos.map(({ horario }) => (
                <div
                  key={`proximo-${horario}`}
                  className={scheduleCardVariants({ status: 'upcoming' })}
                >
                  <span className="sr-only">Próximo horário às {horario}</span>
                  <p className={scheduleTimeVariants({ status: 'upcoming' })} aria-hidden="true">
                    {horario}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!shouldDisableSchedules && passados.length > 0 && (
          <div data-slot="passed-schedules">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <CheckCircle className="text-gray-500" size={20} />
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

        {!shouldDisableSchedules && (
          <div data-slot="summary" className="rounded-lg bg-internoRotas-cinza-grafite p-4 text-sm">
            <p className="text-center text-gray-300">
              Total de {todos.length} horários •{' '}
              <span className="text-green-400">{proximos.length} restantes</span>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
