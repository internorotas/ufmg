/**
 * HorariosModal - Modal de horários da linha
 * Design System - Interno Rotas UFMG
 */

import { useMemo } from "react";
import { tv } from "tailwind-variants";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import type { Linha } from "../types/data.types";
import { timeToMinutes } from "../../lib/utils";
import { shouldDisableRegularSchedules } from "../config/specialPeriods";

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Variantes do card de horário
 */
export const scheduleCardVariants = tv({
  base: "rounded-lg border p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  variants: {
    status: {
      upcoming: [
        "border-green-600 bg-green-900/30 cursor-pointer focus-visible:ring-green-500",
        "hover:bg-green-900/50 hover:scale-105 hover:shadow-md active:scale-95",
      ],
      passed:
        "border-gray-700 bg-gray-800/50 opacity-50 cursor-default focus-visible:ring-gray-500",
    },
  },
  defaultVariants: {
    status: "upcoming",
  },
});

/**
 * Variantes do texto de horário
 */
export const scheduleTimeVariants = tv({
  base: "font-bold",
  variants: {
    status: {
      upcoming: "text-xl text-green-300",
      passed: "text-lg text-gray-400",
    },
  },
  defaultVariants: {
    status: "upcoming",
  },
});

/**
 * Variantes do alerta de suspensão
 */
export const suspensionAlertVariants = tv({
  base: [
    "rounded-lg border p-4 text-center",
    "border-yellow-600 bg-yellow-900/30",
  ],
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
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Verificar se devemos desabilitar os horários
  const isVacationLine = linha.categoriaDia === "feriasRecessos";
  const isInVacationPeriod = shouldDisableRegularSchedules();

  // Verificar se é fim de semana (sábado=6, domingo=0)
  const today = now.getDay();
  const isWeekend = today === 0 || today === 6;

  // Lógica de desabilitar horários durante férias:
  // - Linhas de sábado e dias úteis: SEMPRE desabilitadas durante férias
  // - Linhas de férias/recessos: desabilitadas apenas em fins de semana
  const shouldDisableSchedules =
    isInVacationPeriod && (!isVacationLine || isWeekend);

  // Otimização: memoizar apenas parsing e ordenação que são O(N log N) e não dependem do tempo
  const horariosOrganizados = useMemo(() => {
    return linha.horarios
      .filter((time) => time && time.includes(":"))
      .map((horario) => ({
        horario,
        minutos: timeToMinutes(horario),
      }))
      .sort((a, b) => a.minutos - b.minutos);
  }, [linha.horarios]);

  // Recalcular status de tempo base em tempo real sem re-ordenar
  const { proximos, passados } = useMemo(() => {
    const prox = [];
    const pass = [];
    for (const h of horariosOrganizados) {
      const passou = h.minutos < currentMinutes;
      const horarioItem = { ...h, passou };
      if (passou) {
        pass.push(horarioItem);
      } else {
        prox.push(horarioItem);
      }
    }
    return { proximos: prox, passados: pass };
  }, [horariosOrganizados, currentMinutes]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Horários - ${linha.nome}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Aviso de Horários Suspensos */}
        {shouldDisableSchedules && (
          <div
            data-slot="suspension-alert"
            className={suspensionAlertVariants()}
          >
            <p className="mb-2 font-semibold text-yellow-300">
              <AlertTriangle className="mr-1 inline size-4" />
              Horários suspensos
            </p>
            <p className="text-sm text-yellow-200">
              Esta linha não está operando durante o período de férias e
              recessos. Utilize os horários de "Férias e Recessos".
            </p>
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
              {proximos.map(({ horario }, index) => (
                <div
                  key={`proximo-${index}`}
                  className={scheduleCardVariants({ status: "upcoming" })}
                  tabIndex={0}
                  role="button"
                  aria-label={`Próximo horário às ${horario}`}
                >
                  <p className={scheduleTimeVariants({ status: "upcoming" })}>
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
              {passados.map(({ horario }, index) => (
                <div
                  key={`passado-${index}`}
                  className={scheduleCardVariants({ status: "passed" })}
                >
                  <p className={scheduleTimeVariants({ status: "passed" })}>
                    {horario}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informação Extra */}
        {!shouldDisableSchedules && (
          <div
            data-slot="summary"
            className="rounded-lg bg-internoRotas-cinza-grafite p-4 text-sm"
          >
            <p className="text-center text-gray-300">
              Total de {horariosOrganizados.length} horários •{" "}
              <span className="text-green-400">
                {proximos.length} restantes
              </span>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
