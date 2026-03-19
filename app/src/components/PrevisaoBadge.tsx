import type { Linha } from "../types/data.types";
import { usePrevisaoChegada } from "../hooks/usePrevisaoChegada";

interface PrevisaoBadgeProps {
  linha: Linha;
  idParada: string;
}

export function PrevisaoBadge({ linha, idParada }: PrevisaoBadgeProps) {
  const previsao = usePrevisaoChegada(linha, idParada);

  if (!previsao) {
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

  if (previsao.minutosFaltantes < 1) {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-xs font-bold animate-pulse"
        style={{
          backgroundColor: "var(--success-bg)",
          color: "var(--success-text)",
        }}
        title={`Saida de origem: ${previsao.horarioSaidaOrigem} | Chegada estimada: ${previsao.horarioChegada}`}
      >
        Chegando agora
      </span>
    );
  }

  const isUrgent = previsao.minutosFaltantes <= 15;
  const bgVar = isUrgent ? "--success-bg" : "--warning-bg";
  const textVar = isUrgent ? "--success-text" : "--warning-text";

  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-bold"
      style={{
        backgroundColor: `var(${bgVar})`,
        color: `var(${textVar})`,
      }}
      title={`Saida de origem: ${previsao.horarioSaidaOrigem} | Chegada estimada: ${previsao.horarioChegada}`}
    >
      Chega em {previsao.minutosFaltantes}m
    </span>
  );
}
