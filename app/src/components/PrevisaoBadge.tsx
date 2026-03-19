import type { Linha } from "../types/data.types";
import { usePrevisaoChegada } from "../hooks/usePrevisaoChegada";

interface PrevisaoBadgeProps {
  linha: Linha;
  idParada: string;
}

function formatarTempo(minutos: number): string {
  if (minutos <= 59) {
    return `${minutos}m`;
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (minutosRestantes === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${minutosRestantes}m`;
}

export function PrevisaoBadge({ linha, idParada }: PrevisaoBadgeProps) {
  const previsao = usePrevisaoChegada(linha, idParada);

  if (!previsao || !previsao.proximoOnibus) {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={{
          backgroundColor: "var(--neutral-bg)",
          color: "var(--neutral-text)",
        }}
      >
        Sem previsao
      </span>
    );
  }

  const { proximoOnibus, onibusAnterior, isTrafegoIntenso } = previsao;

  if (proximoOnibus.minutosFaltantes < 1) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${isTrafegoIntenso ? "text-amber-600" : "animate-pulse"}`}
          style={{
            backgroundColor: isTrafegoIntenso
              ? "var(--warning-bg)"
              : "var(--success-bg)",
            color: isTrafegoIntenso ? "#d97706" : "var(--success-text)",
          }}
          title={`Chegada estimada: ${proximoOnibus.horarioChegada}`}
        >
          {isTrafegoIntenso ? "(Transito intenso) Chegando agora" : "Chegando agora"}
        </span>

        {onibusAnterior ? (
          <span className="text-[10px] text-gray-500">
            Ultimo passou ha {onibusAnterior.minutosQuePassou} min
          </span>
        ) : null}
      </div>
    );
  }

  const isUrgent = proximoOnibus.minutosFaltantes <= 15;
  const bgVar = isUrgent ? "--success-bg" : "--warning-bg";
  const textVar = isUrgent ? "--success-text" : "--warning-text";

  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-bold ${isTrafegoIntenso ? "text-amber-600 font-bold" : ""}`}
        style={{
          backgroundColor: isTrafegoIntenso ? "var(--warning-bg)" : `var(${bgVar})`,
          color: isTrafegoIntenso ? "#d97706" : `var(${textVar})`,
        }}
        title={`Chegada estimada: ${proximoOnibus.horarioChegada}`}
      >
        {isTrafegoIntenso
          ? `(Transito intenso) Chega em ${formatarTempo(proximoOnibus.minutosFaltantes)}`
          : `Chega em ${formatarTempo(proximoOnibus.minutosFaltantes)}`}
      </span>

      {onibusAnterior ? (
        <span className="text-[10px] text-gray-500">
          Ultimo passou ha {onibusAnterior.minutosQuePassou} min
        </span>
      ) : null}
    </div>
  );
}
