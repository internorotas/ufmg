/** Utilitários compartilhados de estilo, tempo e regras operacionais de linhas. */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Linha } from '../types/data.types';
import { getSaoPauloDayOfWeek, getSaoPauloMinutesOfDay } from './time';

/**
 * Mescla classes CSS usando clsx e tailwind-merge.
 *
 * @param inputs Classes CSS estáticas e condicionais.
 * @returns String única com classes normalizadas sem conflito de utilitários Tailwind.
 *
 * @example
 * ```tsx
 * cn("px-4 py-2", isActive && "bg-primary", className)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Converte horário `HH:MM` em minutos desde meia-noite.
 *
 * @param horaString Horário no formato textual `HH:MM`.
 * @returns Total de minutos desde `00:00` ou `NaN` quando o formato é inválido.
 */
export function converterHoraParaMinutos(horaString: string): number {
  if (!horaString) return NaN;

  const colonIndex = horaString.indexOf(':');
  if (colonIndex === -1) return NaN;

  const horas = Number(horaString.slice(0, colonIndex));
  const minutos = Number(horaString.slice(colonIndex + 1));

  if (Number.isNaN(horas) || Number.isNaN(minutos)) return NaN;

  return horas * 60 + minutos;
}

/**
 * Converte minutos desde meia-noite para `HH:MM` com normalização cíclica de 24h.
 *
 * @param minutosTotais Valor absoluto ou relativo em minutos.
 * @returns Horário formatado em `HH:MM` ou `--:--` para entrada inválida.
 */
export function converterMinutosParaHora(minutosTotais: number): string {
  if (!Number.isFinite(minutosTotais)) return '--:--';

  const minutosNoDia = 24 * 60;
  const valorNormalizado =
    ((Math.floor(minutosTotais) % minutosNoDia) + minutosNoDia) % minutosNoDia;
  const horas = Math.floor(valorNormalizado / 60);
  const minutos = valorNormalizado % 60;

  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}

interface HorariosPorDia {
  diasUteis?: string[];
  sabados?: string[];
  domingos?: string[];
}

function parseHorarioValido(horario: string): number | null {
  if (!horario || !horario.includes(':')) return null;
  const minutos = converterHoraParaMinutos(horario);
  return Number.isFinite(minutos) ? minutos : null;
}

function obterChaveDiaSemana(dataAtual: Date): keyof HorariosPorDia {
  const diaSemana = getSaoPauloDayOfWeek(dataAtual);
  if (diaSemana === 6) return 'sabados';
  if (diaSemana === 0) return 'domingos';
  return 'diasUteis';
}

function linhaCirculaNoDiaCategoria(linha: Linha, dataAtual: Date): boolean {
  const diaSemana = getSaoPauloDayOfWeek(dataAtual);
  const categoria = linha.categoriaDia;

  if (categoria === 'sabado') return diaSemana === 6;
  if (categoria === 'diasUteis' || categoria === 'feriasRecessos') {
    return diaSemana >= 1 && diaSemana <= 5;
  }

  return true;
}

/**
 * Retorna os horários válidos da linha para o dia atual.
 * Suporta formato legado (array) e formato por dia (objeto).
 *
 * @param linha Linha com estrutura de horários legada ou segmentada por dia.
 * @param dataAtual Data usada para escolher o conjunto de horários vigente.
 * @returns Lista de horários válidos para o dia, já filtrada por formato.
 */
export function obterHorariosLinhaNoDia(linha: Linha, dataAtual: Date): string[] {
  const horariosBrutos = linha.horarios as unknown;

  if (Array.isArray(horariosBrutos)) {
    if (!linhaCirculaNoDiaCategoria(linha, dataAtual)) {
      return [];
    }

    return horariosBrutos.filter((horario) => parseHorarioValido(horario) !== null);
  }

  if (!horariosBrutos || typeof horariosBrutos !== 'object') {
    return [];
  }

  const horariosPorDia = horariosBrutos as HorariosPorDia;
  const chaveDia = obterChaveDiaSemana(dataAtual);
  const horariosDia = horariosPorDia[chaveDia];

  if (!Array.isArray(horariosDia) || horariosDia.length === 0) {
    return [];
  }

  return horariosDia.filter((horario) => parseHorarioValido(horario) !== null);
}

/**
 * Calcula status operacional da linha no instante atual.
 *
 * ⚡ Bolt: Aceita uma lista opcional precalculada de minutos ordenados (horariosPrecalculados).
 * Isso evita re-fazer operações O(N log N) (map + filter + sort) a cada 30 segundos
 * em componentes que já fazem esse parse pesado internamente para renderizar a interface.
 *
 * @param linha Linha a ser classificada.
 * @param dataAtual Data/hora de referência.
 * @param horariosPrecalculados Lista opcional precalculada de minutos ordenados.
 * @returns Identificador técnico, texto de exibição e severidade visual do status.
 */
export function obterStatusLinha(
  linha: Linha,
  dataAtual: Date,
  horariosPrecalculados?: number[],
): { id: string; texto: string; cor: string } {
  const horariosHoje =
    horariosPrecalculados ??
    obterHorariosLinhaNoDia(linha, dataAtual)
      .map((horario) => converterHoraParaMinutos(horario))
      .filter((minutos) => Number.isFinite(minutos))
      .sort((a, b) => a - b);

  if (horariosHoje.length === 0) {
    return {
      id: 'NAO_CIRCULA_HOJE',
      texto: 'Não circula hoje',
      cor: 'danger',
    };
  }

  const agoraMinutos = getSaoPauloMinutesOfDay(dataAtual);
  const primeiroHorario = horariosHoje[0];
  const ultimoHorario = horariosHoje[horariosHoje.length - 1];

  if (agoraMinutos < primeiroHorario) {
    return {
      id: 'AGUARDANDO_PRIMEIRA_SAIDA',
      texto: `Próximo às ${converterMinutosParaHora(primeiroHorario)}`,
      cor: 'warning',
    };
  }

  if (agoraMinutos > ultimoHorario) {
    return {
      id: 'ENCERRADA',
      texto: 'Encerrado',
      cor: 'neutral',
    };
  }

  return {
    id: 'CIRCULANDO',
    texto: 'Circulando',
    cor: 'info',
  };
}

/**
 * Calcula a distância em quilômetros entre duas coordenadas geográficas
 * usando a fórmula de Haversine.
 *
 * @param lat1 Latitude do ponto 1.
 * @param lon1 Longitude do ponto 1.
 * @param lat2 Latitude do ponto 2.
 * @param lon2 Longitude do ponto 2.
 * @returns Distância em quilômetros.
 *
 * @example
 * ```ts
 * // Distância entre UFMG e Praça da Liberdade
 * const distancia = calcularDistanciaKm(-19.87055, -43.96775, -19.9319, -43.9387);
 * console.log(distancia); // ~7.5 km
 * ```
 */
export function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const RAIO_TERRA_KM = 6371;

  const toRad = (graus: number) => (graus * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return RAIO_TERRA_KM * c;
}
