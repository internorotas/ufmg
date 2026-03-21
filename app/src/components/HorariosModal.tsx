/**
 * HorariosModal - Modal de horários da linha
 * Design System - Interno Rotas UFMG
 */

import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useMemo } from 'react';
import { tv } from 'tailwind-variants';
import { findScheduleIndex, timeToMinutes } from '../../lib/utils';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { obterHorariosLinhaNoDia, obterStatusLinha } from '../lib/utils';
import type { Linha } from '../types/data.types';
import { Modal } from './Modal';

// ============================================================================
// VARIANTS
// ============================================================================

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

// ============================================================================
// TYPES
// ============================================================================

export interface HorariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  linha: Linha;
}

// ============================================================================
// COMPONENT
// ============================================================================

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
  const now = useCurrentTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const statusLinha = obterStatusLinha(linha, now);

  const shouldDisableSchedules = statusLinha.id === 'NAO_CIRCULA_HOJE';

  // ⚡ Bolt: Separar parsing e ordenação (O(N log N)) custosos em um useMemo independente
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

  // ⚡ Bolt: Usar busca binária O(log N) e fatiamento virtual (slice) em vez de iterar com map/filter O(N)
  // Isso evita criar novos arrays/objetos base em cada renderização (a cada minuto que o relógio muda).
  // Separamos os componentes "passado" e "futuro" para evitar realocação dos itens O(N)
  const splitIndex = useMemo(() => {
    // Busca binária para achar onde dividir usando um getter para evitar o .map() inicial.
    // Usamos currentMinutes - 1 pois currentMinutes (agora) deve ser considerado 'proximo'
    return findScheduleIndex(baseHorarios, currentMinutes - 1, (h) => h.minutos);
  }, [baseHorarios, currentMinutes]);

  // Zero-allocation das sublistas virtuais
  const passados = baseHorarios.slice(0, splitIndex);
  const proximos = baseHorarios.slice(splitIndex);
  const todos = baseHorarios;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Horários - ${linha.nome}`} size="md">
      <div className="space-y-6">
        {/* Aviso de Horários Suspensos */}
        {shouldDisableSchedules && (
          <div data-slot="suspension-alert" className={suspensionAlertVariants()}>
            <p className="mb-2 font-semibold text-yellow-300">
              <AlertTriangle className="mr-1 inline size-4" />
              Linha sem operação hoje
            </p>
            <p className="text-sm text-yellow-200">{statusLinha.texto}</p>
          </div>
        )}

        {/* Próximos Horários */}
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

        {/* Horários Passados */}
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

        {/* Informação Extra */}
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
