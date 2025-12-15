import { IoInformationCircleOutline } from "react-icons/io5";
import { getCurrentSpecialPeriod, isWeekday } from "../config/specialPeriods";

/**
 * Renderiza um banner informativo durante períodos de férias e recessos.
 * O banner aparece apenas quando há um período especial ativo.
 *
 * @returns {JSX.Element | null} O componente de banner de férias ou null se não houver período ativo.
 */
export function VacationBanner() {
  const specialPeriod = getCurrentSpecialPeriod();

  // Não mostrar se não houver período especial ativo
  if (!specialPeriod) {
    return null;
  }

  const isWeekdayToday = isWeekday();

  return (
    <div
      className="mb-3 p-3 rounded-lg border flex items-start gap-2"
      style={{
        backgroundColor: "var(--warning-bg)",
        borderColor: "var(--warning-border)",
      }}
    >
      <IoInformationCircleOutline
        className="flex-shrink-0 mt-0.5"
        size={20}
        style={{ color: "var(--warning-text)" }}
      />
      <div
        className="text-xs lg:text-sm leading-relaxed"
        style={{ color: "var(--warning-text)" }}
      >
        <p className="font-bold mb-1">{specialPeriod.name}</p>
        <p>
          De {specialPeriod.startDate.toLocaleDateString("pt-BR")} a{" "}
          {specialPeriod.endDate.toLocaleDateString("pt-BR")}, operam apenas os
          horários de Férias e Recessos. Não há circulação aos fins de semana e
          feriados.
        </p>
        {!isWeekdayToday && (
          <p className="mt-2 font-semibold">
            ⚠️ Hoje não há circulação de ônibus (apenas em dias úteis).
          </p>
        )}
      </div>
    </div>
  );
}
