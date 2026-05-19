import { useMemo } from 'react';
import { isLineAvailableToday } from '../config/specialPeriods';
import { obterMultiplicadorTrafego } from '../config/trafegoConfig';
import { getSaoPauloMinutesOfDay, getSaoPauloNow, toSaoPauloDate } from '../lib/time';
import { converterMinutosParaHora, obterHorariosMinutosLinhaNoDia } from '../lib/utils';
import type { Linha } from '../types/data.types';
import { useCurrentTime } from './useCurrentTime';

/** Próximo ônibus estimado para a parada consultada. */
interface ProximoOnibus {
  horarioChegada: string;
  minutosFaltantes: number;
}

/** Último ônibus que já passou recentemente na parada consultada. */
interface OnibusAnterior {
  minutosQuePassou: number;
}

/**
 * Estrutura de retorno do motor de ETA.
 * O resultado é intencionalmente compacto para facilitar uso em cards e modais.
 */
export interface PrevisaoChegadaResultado {
  proximoOnibus: ProximoOnibus | null;
  onibusAnterior: OnibusAnterior | null;
  isTrafegoIntenso: boolean;
}

/**
 * Calcula a ETA para uma parada específica a partir da grade de horários da linha.
 *
 * A função existe para manter a regra de negócio isolada de React, permitindo
 * reutilização em hooks, testes e fluxos de renderização sem efeitos colaterais.
 *
 * @param linha Linha cuja previsão será calculada.
 * @param idParadaAtual ID da parada de destino dentro do trajeto da linha.
 * @param agora Data/hora de referência para o cálculo; padrão é o horário atual.
 * @returns Estrutura de previsão com próximo ônibus, último ônibus recente e flag de tráfego.
 */
export function calcularPrevisaoChegada(
  linha: Linha,
  idParadaAtual: string,
  agora: Date = getSaoPauloNow(),
): PrevisaoChegadaResultado | null {
  if (!isLineAvailableToday(linha.categoriaDia)) {
    return null;
  }

  if (!linha.trajetoDetalhado || linha.trajetoDetalhado.length === 0) {
    return null;
  }
  const agoraSaoPaulo = toSaoPauloDate(agora);
  const horariosSaida = obterHorariosMinutosLinhaNoDia(linha, agoraSaoPaulo);
  if (horariosSaida.length === 0) return null;

  const horaAtualMinutos = getSaoPauloMinutesOfDay(agoraSaoPaulo);
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

  tempoViagemReal = Math.round(tempoViagemReal);

  if (!paradaEncontrada) return null;

  const isTrafegoIntenso = multiplicadorTrafego > 1.0;
  const MINUTOS_DIA = 1440;
  const HORA_INICIO_VIRADA = 22 * 60;
  const HORA_MAX_AMANHA = 2 * 60;

  let proximoOnibus: ProximoOnibus | null = null;
  let ultimaChegadaPassada: number | null = null;

  for (let i = 0; i < horariosSaida.length; i++) {
    const saidaMinutos = horariosSaida[i];
    if (Number.isNaN(saidaMinutos)) continue;

    let chegadaPrevistaMinutos = saidaMinutos + tempoViagemReal;

    if (chegadaPrevistaMinutos >= MINUTOS_DIA) {
      chegadaPrevistaMinutos -= MINUTOS_DIA;
    }

    // Regras para evitar ETA negativa na virada da meia-noite.
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

/**
 * Hook de conveniência para calcular ETA reativa com base no relógio do app.
 *
 * @param linha Linha selecionada ou `null` quando nenhuma linha está ativa.
 * @param idParadaAtual ID da parada selecionada ou `null` quando não há parada ativa.
 * @returns Resultado da previsão ou `null` quando não há dados suficientes.
 */
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
