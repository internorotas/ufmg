import type { Linha } from "../types/data.types";
import {
  converterHoraParaMinutos,
  converterMinutosParaHora,
} from "../lib/utils";
import { obterMultiplicadorTrafego } from "../config/trafegoConfig";

interface ProximoOnibus {
  horarioChegada: string;
  minutosFaltantes: number;
}

interface OnibusAnterior {
  minutosQuePassou: number;
}

export interface PrevisaoChegadaResultado {
  proximoOnibus: ProximoOnibus | null;
  onibusAnterior: OnibusAnterior | null;
  isTrafegoIntenso: boolean;
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

  let tempoViagemBase = 0;
  let paradaEncontrada = false;

  for (const trecho of linha.trajetoDetalhado) {
    tempoViagemBase += trecho.tempoDoAnteriorMinutos;
    if (trecho.idParada === idParadaAtual) {
      paradaEncontrada = true;
      break;
    }
  }

  if (!paradaEncontrada) return null;

  const agora = new Date();
  const horaAtualMinutos = agora.getHours() * 60 + agora.getMinutes();
  const multiplicador = obterMultiplicadorTrafego(horaAtualMinutos);
  const tempoViagemReal = Math.round(tempoViagemBase * multiplicador);
  const isTrafegoIntenso = multiplicador > 1.0;

  let proximoOnibus: ProximoOnibus | null = null;
  let ultimaChegadaPassada: number | null = null;

  for (let index = 0; index < linha.horarios.length; index++) {
    const horarioSaidaOrigem = linha.horarios[index];
    const saidaMinutos = converterHoraParaMinutos(horarioSaidaOrigem);
    if (Number.isNaN(saidaMinutos)) continue;

    const chegadaPrevistaMinutos = saidaMinutos + tempoViagemReal;

    if (chegadaPrevistaMinutos <= horaAtualMinutos) {
      ultimaChegadaPassada = chegadaPrevistaMinutos;
    }

    if (chegadaPrevistaMinutos >= horaAtualMinutos) {
      proximoOnibus = {
        horarioChegada: converterMinutosParaHora(chegadaPrevistaMinutos),
        minutosFaltantes: Math.max(0, chegadaPrevistaMinutos - horaAtualMinutos),
      };

      break;
    }
  }

  let onibusAnterior: OnibusAnterior | null = null;
  if (ultimaChegadaPassada !== null) {
    const minutosQuePassou = horaAtualMinutos - ultimaChegadaPassada;
    if (minutosQuePassou >= 0 && minutosQuePassou <= 15) {
      onibusAnterior = { minutosQuePassou };
    }
  }

  return {
    proximoOnibus,
    onibusAnterior,
    isTrafegoIntenso,
  };
}
