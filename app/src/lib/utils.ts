/** Utilitários compartilhados de estilo, tempo e regras operacionais de linhas. */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isLineAvailableToday } from '../config/specialPeriods';
import type { Linha } from '../types/data.types';
import { getSaoPauloDayOfWeek, getSaoPauloMinutesOfDay, getSaoPauloNow } from './time';

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

function normalizarHexCor(valor: string): string | null {
  const cor = valor.trim();

  if (!cor.startsWith('#')) {
    return null;
  }

  if (/^#[\da-fA-F]{3}$/.test(cor)) {
    return `#${cor[1]}${cor[1]}${cor[2]}${cor[2]}${cor[3]}${cor[3]}`.toLowerCase();
  }

  if (/^#[\da-fA-F]{6}$/.test(cor)) {
    return cor.toLowerCase();
  }

  return null;
}

/**
 * Converte uma cor hexadecimal para rgba com alpha configurável.
 * Retorna a cor de marca como fallback quando o valor informado é inválido.
 */
export function hexToRgba(hexColor: string, alpha = 1): string {
  const normalizedColor = normalizarHexCor(hexColor) ?? '#2c0eeb';
  const clampedAlpha = Math.min(1, Math.max(0, alpha));

  const red = Number.parseInt(normalizedColor.slice(1, 3), 16);
  const green = Number.parseInt(normalizedColor.slice(3, 5), 16);
  const blue = Number.parseInt(normalizedColor.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${clampedAlpha})`;
}

/**
 * Converte horário `HH:MM` em minutos desde meia-noite.
 *
 * @param horaString Horário no formato textual `HH:MM`.
 * @returns Total de minutos desde `00:00` ou `NaN` quando o formato é inválido.
 */
export function converterHoraParaMinutos(horaString: string): number {
  if (!horaString) return NaN;

  // Fast path: if the string matches "HH:MM", we avoid string slicing/allocations
  // and parse digits directly using character codes.
  if (horaString.length === 5 && horaString[2] === ':') {
    const h1 = horaString.charCodeAt(0) - 48;
    const h2 = horaString.charCodeAt(1) - 48;
    const m1 = horaString.charCodeAt(3) - 48;
    const m2 = horaString.charCodeAt(4) - 48;

    if (h1 >= 0 && h1 <= 9 && h2 >= 0 && h2 <= 9 && m1 >= 0 && m1 <= 9 && m2 >= 0 && m2 <= 9) {
      return (h1 * 10 + h2) * 60 + (m1 * 10 + m2);
    }
  }

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

  const minutosNoDia = 1440; // 24 * 60
  const valorNormalizado =
    ((Math.floor(minutosTotais) % minutosNoDia) + minutosNoDia) % minutosNoDia;
  const horas = Math.floor(valorNormalizado / 60);
  const minutos = valorNormalizado % 60;

  // Manual conditional formatting is significantly faster than using .padStart()
  // or template literals because it avoids object creation and string allocations
  // in high-volume paths.
  // biome-ignore lint/style/useTemplate: string concatenation is faster for this specific format
  const hStr = horas < 10 ? '0' + horas : '' + horas;
  // biome-ignore lint/style/useTemplate: string concatenation is faster for this specific format
  const mStr = minutos < 10 ? '0' + minutos : '' + minutos;

  // biome-ignore lint/style/useTemplate: string concatenation is faster for this specific format
  return hStr + ':' + mStr;
}

interface HorariosPorDia {
  diasUteis?: string[];
  sabados?: string[];
  domingos?: string[];
}

function parseHorarioValido(horario: string): number | null {
  if (!horario?.includes(':')) return null;
  const minutos = converterHoraParaMinutos(horario);
  return Number.isFinite(minutos) ? minutos : null;
}

function obterChaveDiaSemana(dataAtual: Date): keyof HorariosPorDia {
  const diaSemana = getSaoPauloDayOfWeek(dataAtual);
  if (diaSemana === 6) return 'sabados';
  if (diaSemana === 0) return 'domingos';
  return 'diasUteis';
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
  // Regra de negócio central: somente linhas vigentes no dia entram no motor de horários/ETA.
  if (!isLineAvailableToday(linha.categoriaDia)) {
    return [];
  }

  const horariosBrutos = linha.horarios as unknown;

  if (Array.isArray(horariosBrutos)) {
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
 * @param linha Linha a ser classificada.
 * @param dataAtual Data/hora de referência.
 * @returns Identificador técnico, texto de exibição e severidade visual do status.
 */
export function obterStatusLinha(
  linha: Linha,
  dataAtual: Date,
  horariosPreCalculados?: number[],
): { id: string; texto: string; cor: string } {
  // Verifica disponibilidade primeiro, independente de horários pré-calculados.
  // Sem este guarda, linhas de sábado/férias passariam como "Circulando" em
  // dias úteis quando `horariosPreCalculados` é fornecido (e não é vazio).
  if (!isLineAvailableToday(linha.categoriaDia)) {
    return { id: 'NAO_CIRCULA_HOJE', texto: 'Não circula hoje', cor: 'danger' };
  }

  const horariosHoje =
    horariosPreCalculados ??
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

const TO_RAD = Math.PI / 180;
const RAIO_TERRA_KM = 6371;

/**
 * Calcula a distância em quilômetros entre duas coordenadas geográficas
 * usando a fórmula de Haversine. Otimizado para performance em loops quentes.
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
  const dLat = (lat2 - lat1) * TO_RAD;
  const dLon = (lon2 - lon1) * TO_RAD;

  const lat1Rad = lat1 * TO_RAD;
  const lat2Rad = lat2 * TO_RAD;

  const sinDLat2 = Math.sin(dLat / 2);
  const sinDLon2 = Math.sin(dLon / 2);

  const a = sinDLat2 * sinDLat2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinDLon2 * sinDLon2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return RAIO_TERRA_KM * c;
}

/**
 * Encontra o índice do primeiro elemento do array cujo valor é estritamente
 * maior que o alvo. Retorna o tamanho do array quando não há elemento futuro.
 * Requer array ordenado em ordem crescente.
 */
export function findScheduleIndex<T>(
  sortedArray: T[],
  target: number,
  getVal: (item: T) => number = (item) => item as unknown as number,
): number {
  let left = 0;
  let right = sortedArray.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (getVal(sortedArray[mid]) > target) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }

  return left;
}

const _paradasCache = new WeakMap<object, Map<string, unknown>>();

/**
 * Busca paradas do itinerário pelos IDs fornecidos, preservando a ordem.
 * Usa WeakMap como cache para evitar recriar o mapa a cada chamada.
 */
export function buscarParadasPorIds<T extends { idParada: string }>(
  itinerarioParadasIds: string[],
  todasParadas: T[],
): T[] {
  let paradasMap = _paradasCache.get(todasParadas) as Map<string, T> | undefined;

  if (!paradasMap) {
    paradasMap = new Map<string, T>();
    for (const parada of todasParadas) {
      paradasMap.set(parada.idParada, parada);
    }
    _paradasCache.set(todasParadas, paradasMap);
  }

  return itinerarioParadasIds
    .map((id) => (paradasMap as Map<string, T>).get(id))
    .filter((p): p is T => p !== undefined);
}

/**
 * Normaliza o nome de uma linha para busca case-insensitive sem acentos.
 * Remove conteúdos entre parênteses para evitar diferenças de nomenclatura.
 */
export function normalizarNomeLinha(nomeLinha: string): string {
  return nomeLinha
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos (acentos)
    .replace(/\s*\(.*?\)\s*/g, ' ') // remove conteúdo entre parênteses
    .replace(/[^\w\s]/g, ' ') // substitui pontuação/símbolos por espaço
    .replace(/\s+/g, ' ') // colapsa múltiplos espaços
    .trim()
    .toLowerCase();
}

/**
 * Aliases para compatibilidade com código legado que usa nomenclatura em inglês.
 * Prefira `converterHoraParaMinutos` e `converterMinutosParaHora` em código novo.
 */
export const timeToMinutes = converterHoraParaMinutos;
export const minutesToTime = converterMinutosParaHora;

/**
 * Calcula o próximo e o anterior horário com base no horário atual de São Paulo.
 *
 * @param horarios Lista de horários no formato `HH:MM`.
 * @returns Objeto com `nextSchedule` e `previousSchedule` formatados em `HH:MM`.
 */
export function calculateNextAndPreviousSchedule(horarios: string[]): {
  nextSchedule: string;
  previousSchedule: string;
} {
  if (!horarios || horarios.length === 0) {
    return { nextSchedule: '--:--', previousSchedule: '--:--' };
  }

  const currentMinutes = getSaoPauloMinutesOfDay(getSaoPauloNow());

  const schedulesInMinutes = horarios
    .filter((time) => time?.includes(':'))
    .map(converterHoraParaMinutos)
    .sort((a, b) => a - b);

  if (schedulesInMinutes.length === 0) {
    return { nextSchedule: '--:--', previousSchedule: '--:--' };
  }

  const nextIndex = findScheduleIndex(schedulesInMinutes, currentMinutes);

  let nextSchedule: string;
  let previousSchedule: string;

  if (nextIndex < schedulesInMinutes.length) {
    nextSchedule = converterMinutosParaHora(schedulesInMinutes[nextIndex]);

    let prevIndex = nextIndex - 1;
    while (prevIndex >= 0 && schedulesInMinutes[prevIndex] >= currentMinutes) {
      prevIndex--;
    }

    previousSchedule =
      prevIndex >= 0
        ? converterMinutosParaHora(schedulesInMinutes[prevIndex])
        : converterMinutosParaHora(schedulesInMinutes[schedulesInMinutes.length - 1]);
  } else {
    nextSchedule = converterMinutosParaHora(schedulesInMinutes[0]);

    let prevIndex = schedulesInMinutes.length - 1;
    while (prevIndex >= 0 && schedulesInMinutes[prevIndex] >= currentMinutes) {
      prevIndex--;
    }

    previousSchedule =
      prevIndex >= 0
        ? converterMinutosParaHora(schedulesInMinutes[prevIndex])
        : converterMinutosParaHora(schedulesInMinutes[schedulesInMinutes.length - 1]);
  }

  return { nextSchedule, previousSchedule };
}
