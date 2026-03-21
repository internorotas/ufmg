import { useMemo } from 'react';
import { obterMultiplicadorTrafego } from '../config/trafegoConfig';
import {
  converterHoraParaMinutos,
  converterMinutosParaHora,
  obterHorariosLinhaNoDia,
} from '../lib/utils';
import type { Linha } from '../types/data.types';
import { useCurrentTime } from './useCurrentTime';

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

/**
 * Função pura que calcula a previsão de chegada de uma linha em uma parada.
 * Pode ser chamada fora de contexto React (sem hook).
 */
export function calcularPrevisaoChegada(
  linha: Linha,
  idParadaAtual: string,
  agora: Date = new Date(),
): PrevisaoChegadaResultado | null {
  if (!linha.trajetoDetalhado || linha.trajetoDetalhado.length === 0) {
    return null;
  }
  const horariosSaida = obterHorariosLinhaNoDia(linha, agora);
  if (horariosSaida.length === 0) return null;

  const horaAtualMinutos = agora.getHours() * 60 + agora.getMinutes();
  const multiplicadorTrafego = obterMultiplicadorTrafego(horaAtualMinutos);

  let tempoViagemReal = 0;
  let paradaEncontrada = false;

  for (const trecho of linha.trajetoDetalhado) {
    const tempoBase = trecho.tempoDoAnteriorMinutos;
    // Trechos externos ao campus sofrem o impacto do trânsito; internos usam tempo nominal.
    if (trecho.isTrechoExterno) {
      tempoViagemReal += tempoBase * multiplicadorTrafego;
    } else {
      tempoViagemReal += tempoBase;
    }
    if (trecho.idParada === idParadaAtual) {
      paradaEncontrada = true;
      break;
    }
  }

  // Arredonda o tempo final para não termos minutos quebrados
  tempoViagemReal = Math.round(tempoViagemReal);

  if (!paradaEncontrada) return null;

  const isTrafegoIntenso = multiplicadorTrafego > 1.0;
  // Limites para lidar com virada de meia-noite
  const MINUTOS_DIA = 1440;
  const HORA_INICIO_VIRADA = 22 * 60; // 22h: considerado "fim do dia"
  const HORA_MAX_AMANHA = 2 * 60; // até 02h: ainda pertence ao turno anterior

  let proximoOnibus: ProximoOnibus | null = null;
  let ultimaChegadaPassada: number | null = null;

  for (let i = 0; i < horariosSaida.length; i++) {
    const saidaMinutos = converterHoraParaMinutos(horariosSaida[i]);
    if (Number.isNaN(saidaMinutos)) continue;

    let chegadaPrevistaMinutos = saidaMinutos + tempoViagemReal;

    // Ajuste se passar das 24h
    if (chegadaPrevistaMinutos >= MINUTOS_DIA) {
      chegadaPrevistaMinutos -= MINUTOS_DIA;
    }

    // Lidar com virada de dia: se é quase meia-noite e o ônibus chega após a meia-noite
    let ajusteChegada = chegadaPrevistaMinutos;
    if (horaAtualMinutos > HORA_INICIO_VIRADA && chegadaPrevistaMinutos < HORA_MAX_AMANHA) {
      ajusteChegada += MINUTOS_DIA;
    }

    if (ajusteChegada <= horaAtualMinutos) {
      ultimaChegadaPassada = ajusteChegada;
    }

    if (ajusteChegada >= horaAtualMinutos) {
      proximoOnibus = {
        horarioChegada: converterMinutosParaHora(chegadaPrevistaMinutos),
        minutosFaltantes: Math.max(0, ajusteChegada - horaAtualMinutos),
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

export function usePrevisaoChegada(
  linha: Linha | null,
  idParadaAtual: string | null,
): PrevisaoChegadaResultado | null {
  const dataAtual = useCurrentTime();

  return useMemo(() => {
    if (!linha || !idParadaAtual) return null;
    return calcularPrevisaoChegada(linha, idParadaAtual, dataAtual);
  }, [linha, idParadaAtual, dataAtual]);
}
