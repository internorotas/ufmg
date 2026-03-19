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
  const horariosSaida = linha.horarios;

  let proximoOnibus: ProximoOnibus | null = null;
  let ultimaChegadaPassada: number | null = null;

  for (let i = 0; i < horariosSaida.length; i++) {
    const saidaMinutos = converterHoraParaMinutos(horariosSaida[i]);
    if (Number.isNaN(saidaMinutos)) continue;

    let chegadaPrevistaMinutos = saidaMinutos + tempoViagemReal;

    // Ajuste se passar das 24h (1440 minutos)
    if (chegadaPrevistaMinutos >= 1440) {
      chegadaPrevistaMinutos -= 1440;
    }

    // Lidando com a virada (ex: sao 23h50 e o onibus chega 00h10)
    const ajusteHoraAtual = horaAtualMinutos;
    let ajusteChegada = chegadaPrevistaMinutos;

    if (horaAtualMinutos > 1320 && chegadaPrevistaMinutos < 120) {
      ajusteChegada += 1440; // Adiciona 24h virtualmente so para a comparacao
    }

    if (ajusteChegada <= ajusteHoraAtual) {
      ultimaChegadaPassada = ajusteChegada;
    }

    if (ajusteChegada >= ajusteHoraAtual) {
      proximoOnibus = {
        horarioChegada: converterMinutosParaHora(chegadaPrevistaMinutos),
        minutosFaltantes: Math.max(0, ajusteChegada - ajusteHoraAtual),
      };

      break;
    }
  }

  let onibusAnterior: OnibusAnterior | null = null;
  if (ultimaChegadaPassada !== null) {
    const minutosQuePassou = Math.max(0, horaAtualMinutos - ultimaChegadaPassada);
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
