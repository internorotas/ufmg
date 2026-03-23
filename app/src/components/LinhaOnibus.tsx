/**
 * LinhaOnibus - Card de linha de ônibus
 * Design System - Interno Rotas UFMG
 */

import { Clock, Map as MapIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { tv } from 'tailwind-variants';
import { calculateNextAndPreviousSchedule } from '../../lib/utils';
import { shouldDisableRegularSchedules } from '../config/specialPeriods';
import { useAnalytics } from '../hooks/useAnalytics';
import type { Linha, Parada } from '../types/data.types';
import { HorariosModal } from './HorariosModal';
import { ItinerarioModal } from './ItinerarioModal';

/**
 * Variantes do card da linha
 */
export const lineCardContainerVariants = tv({
  base: 'mb-2',
});

/**
 * Variantes do header da linha
 */
export const lineHeaderVariants = tv({
  base: [
    'flex w-full items-center justify-between rounded-t-lg p-3 shadow-md',
    'font-bold text-white transition-colors cursor-pointer',
  ],
});

/**
 * Variantes do botão de ação
 */
export const actionButtonVariants = tv({
  base: [
    'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5',
    'text-sm font-medium text-white transition-colors cursor-pointer',
  ],
  variants: {
    intent: {
      primary: 'bg-internoRotas-azul-eletrico hover:bg-blue-700',
      secondary: 'bg-internoRotas-laranja-ambar hover:bg-orange-600',
    },
  },
  defaultVariants: {
    intent: 'primary',
  },
});

/**
 * Variantes do alerta de suspensão
 */
export const suspensionAlertVariants = tv({
  base: ['mb-4 rounded-lg border p-4 text-center', 'border-red-600 bg-red-900/30'],
});

export interface LinhaOnibusProps {
  linha: Linha;
  onLinhaClick: () => void;
  bgColor: string;
  paradas: Parada[];
  onParadaClick: (parada: Parada) => void;
}

/**
 * Card de linha de ônibus com informações de horário e ações.
 *
 * @example
 * ```tsx
 * <LinhaOnibus
 *   linha={linhaData}
 *   onLinhaClick={() => selectLine(linha)}
 *   bgColor="bg-blue-500"
 *   paradas={paradasData}
 *   onParadaClick={(parada) => focusOnMap(parada)}
 * />
 * ```
 */
export function LinhaOnibus({
  linha,
  onLinhaClick,
  bgColor,
  paradas,
  onParadaClick,
}: LinhaOnibusProps) {
  const analytics = useAnalytics();
  const [isItinerarioVisible, setItinerarioVisible] = useState(false);
  const [isHorariosVisible, setHorariosVisible] = useState(false);

  // Verificar se é linha de férias ou dias regulares
  const isVacationLine = linha.categoriaDia === 'feriasRecessos';
  const isInVacationPeriod = shouldDisableRegularSchedules();

  // Verificar se é fim de semana (sábado=6, domingo=0)
  const today = new Date().getDay();
  const isWeekend = today === 0 || today === 6;

  // Lógica de desabilitar horários durante férias:
  // - Linhas de sábado e dias úteis: SEMPRE desabilitadas durante férias
  // - Linhas de férias/recessos: desabilitadas apenas em fins de semana
  const shouldDisableSchedules = isInVacationPeriod && (!isVacationLine || isWeekend);

  // Calcular horários anterior e próximo (ou mostrar Encerrado se desabilitado)
  const { nextSchedule, previousSchedule } = useMemo(() => {
    if (shouldDisableSchedules) {
      return { nextSchedule: 'Encerrado', previousSchedule: 'Encerrado' };
    }
    return calculateNextAndPreviousSchedule(linha.horarios);
  }, [linha.horarios, shouldDisableSchedules]);

  const handleItinerarioToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    analytics.trackEvent({
      category: 'navigation',
      action: 'view_stop_details',
      label: linha.nome,
    });
    setItinerarioVisible(true);
  };

  const handleHorariosToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    analytics.trackEvent({
      category: 'engagement',
      action: 'view_schedule',
      label: linha.nome,
    });
    setHorariosVisible(true);
  };

  const handleExpandLineCard = () => {
    analytics.trackEvent({
      category: 'engagement',
      action: 'expand_line_card',
      label: linha.nome,
    });
    onLinhaClick();
  };

  return (
    <>
      <div data-slot="line-card" className={lineCardContainerVariants()}>
        <button
          type="button"
          onClick={handleExpandLineCard}
          className={`${lineHeaderVariants()} ${bgColor}`}
          aria-label={`Ver detalhes da linha ${linha.nome}`}
          title={`Ver detalhes da linha ${linha.nome}`}
        >
          <div className="text-left">
            <h1 className="text-base">{linha.nome}</h1>
            {linha.sublinha && <p className="text-xs font-normal">{linha.sublinha}</p>}
          </div>
        </button>

        <div className="rounded-b-lg bg-internoRotas-cinza-grafite px-1 py-2">
          <div className="bg-internoRotas-cinza-grafite p-4 text-white">
            {/* Aviso de Horários Suspensos ou Horários Normais */}
            {shouldDisableSchedules ? (
              <div data-slot="suspension-alert" className={suspensionAlertVariants()}>
                <p className="mb-1 text-sm font-bold text-red-300">🚫 NÃO CIRCULANDO</p>
                <p className="text-xs text-red-200">
                  Esta linha está suspensa durante o período de férias
                </p>
              </div>
            ) : (
              <div data-slot="schedules" className="mb-4 flex justify-between text-center">
                <div>
                  <p className="mb-1 text-xs text-gray-400">Último Partiu</p>
                  <p className="text-xl font-bold">{previousSchedule}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-400">Próximo</p>
                  <p className="text-xl font-bold text-green-400">{nextSchedule}</p>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div data-slot="actions" className="flex gap-2">
              <button
                type="button"
                onClick={handleItinerarioToggle}
                className={actionButtonVariants({ intent: 'primary' })}
                aria-label={`Ver itinerário da linha ${linha.nome}`}
                title="Ver Itinerário"
              >
                <MapIcon size={18} />
                Itinerário
              </button>
              <button
                type="button"
                onClick={handleHorariosToggle}
                className={actionButtonVariants({ intent: 'secondary' })}
                aria-label={`Ver mais horários da linha ${linha.nome}`}
                title="Mais Horários"
              >
                <Clock size={18} />
                Mais Horários
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      <HorariosModal
        isOpen={isHorariosVisible}
        onClose={() => setHorariosVisible(false)}
        linha={linha}
      />
      <ItinerarioModal
        isOpen={isItinerarioVisible}
        onClose={() => setItinerarioVisible(false)}
        linha={linha}
        paradas={paradas}
        onParadaClick={onParadaClick}
      />
    </>
  );
}
