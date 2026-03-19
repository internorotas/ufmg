import type { Linha } from "../types/data.types";
import {
  converterHoraParaMinutos,
  converterMinutosParaHora,
} from "../lib/utils";

export interface PrevisaoChegadaResultado {
  horarioChegada: string;
  minutosFaltantes: number;
  horarioSaidaOrigem: string;
}

export function usePrevisaoChegada(
  linha: Linha | null,
  idParadaAtual: string | null,
): PrevisaoChegadaResultado | null {
  if (!linha || !idParadaAtual) return null;
  if (!linha.trajetoDetalhado || linha.trajetoDetalhado.length === 0) {
    return null;
  }
  if (!linha.horarios || linha.horarios.length === 0) return null;

  let tempoViagemAteAqui = 0;
  let paradaEncontrada = false;

  for (const trecho of linha.trajetoDetalhado) {
    tempoViagemAteAqui += trecho.tempoDoAnteriorMinutos;
    if (trecho.idParada === idParadaAtual) {
      paradaEncontrada = true;
      break;
    }
  }

  if (!paradaEncontrada) return null;

  const agora = new Date();
  const minutosAtuais = agora.getHours() * 60 + agora.getMinutes();

  for (const horarioSaidaOrigem of linha.horarios) {
    const saidaMinutos = converterHoraParaMinutos(horarioSaidaOrigem);
    if (Number.isNaN(saidaMinutos)) continue;

    const chegadaPrevistaMinutos = saidaMinutos + tempoViagemAteAqui;

    if (chegadaPrevistaMinutos >= minutosAtuais) {
      return {
        horarioChegada: converterMinutosParaHora(chegadaPrevistaMinutos),
        minutosFaltantes: Math.max(0, chegadaPrevistaMinutos - minutosAtuais),
        horarioSaidaOrigem,
      };
    }
  }

  return null;
}
