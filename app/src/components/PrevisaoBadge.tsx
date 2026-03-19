import type { Linha } from "../types/data.types";
import { Info } from "lucide-react";
import { usePrevisaoChegada } from "../hooks/usePrevisaoChegada";

interface PrevisaoBadgeProps {
  linha: Linha;
  idParada: string;
  compacto?: boolean;
}

function formatarDuracao(minutos: number): string {
  if (minutos <= 59) {
    return `${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (minutosRestantes === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${minutosRestantes}min`;
}

export function PrevisaoBadge({
  linha,
  idParada,
  compacto = false,
}: PrevisaoBadgeProps) {
  const previsao = usePrevisaoChegada(linha, idParada);
  const textoTooltip =
    "Horário estimado com base no cronograma oficial. Sem rastreamento via GPS.";

  if (!previsao || !previsao.proximoOnibus) {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={{
          backgroundColor: "var(--neutral-bg)",
          color: "var(--neutral-text)",
        }}
      >
        Sem previsão
      </span>
    );
  }

  const { proximoOnibus, onibusAnterior, isTrafegoIntenso } = previsao;

  if (proximoOnibus.minutosFaltantes < 1) {
    return (
      <div className="flex min-w-0 flex-col items-end gap-1">
        <span
          className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-xs font-bold ${isTrafegoIntenso ? "text-amber-600" : ""} ${compacto ? "max-w-[170px]" : ""}`}
          style={{
            backgroundColor: isTrafegoIntenso
              ? "var(--warning-bg)"
              : "var(--success-bg)",
            color: isTrafegoIntenso ? "#d97706" : "var(--success-text)",
          }}
          title={textoTooltip}
        >
          <span className="inline-flex min-w-0 items-center gap-1">
            <span className={compacto ? "truncate" : ""}>
              {isTrafegoIntenso
                ? "(Trânsito intenso) Chega agora"
                : "Chega agora"}
            </span>
            <Info size={12} aria-hidden="true" />
          </span>
        </span>

        {onibusAnterior ? (
          <span className="text-[10px] text-gray-500">
            Último passou há {onibusAnterior.minutosQuePassou} min
          </span>
        ) : null}
      </div>
    );
  }

  const isUrgent = proximoOnibus.minutosFaltantes <= 15;
  const bgVar = isUrgent ? "--success-bg" : "--warning-bg";
  const textVar = isUrgent ? "--success-text" : "--warning-text";
  const textoPrevisao = compacto
    ? `Chega em ~${formatarDuracao(proximoOnibus.minutosFaltantes)}`
    : `Chega em aproximadamente ${formatarDuracao(proximoOnibus.minutosFaltantes)}`;

  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <span
        className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-xs font-bold ${isTrafegoIntenso ? "text-amber-600 font-bold" : ""} ${compacto ? "max-w-[170px]" : ""}`}
        style={{
          backgroundColor: isTrafegoIntenso
            ? "var(--warning-bg)"
            : `var(${bgVar})`,
          color: isTrafegoIntenso ? "#d97706" : `var(${textVar})`,
        }}
        title={textoTooltip}
      >
        <span className="inline-flex min-w-0 items-center gap-1">
          <span className={compacto ? "truncate" : ""}>
            {isTrafegoIntenso
              ? `(Trânsito intenso) ${textoPrevisao}`
              : textoPrevisao}
          </span>
        </span>
      </span>

      {onibusAnterior ? (
        <span className="text-[10px] text-gray-500">
          Último passou há {onibusAnterior.minutosQuePassou} min
        </span>
      ) : null}
    </div>
  );
}
