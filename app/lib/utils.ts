/**
 * Arquivo de funcoes utilitarias do projeto UFMG
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Mescla classes CSS usando clsx e tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converte horario no formato HH:MM em minutos desde meia-noite.
 */
export function timeToMinutes(time: string): number {
  if (!time) return NaN;
  const colonIndex = time.indexOf(":");
  if (colonIndex === -1) return NaN;

  const hours = Number(time.slice(0, colonIndex));
  const minutes = Number(time.slice(colonIndex + 1));

  return hours * 60 + minutes;
}

/**
 * Converte minutos desde meia-noite para formato HH:MM.
 */
export function minutesToTime(minutes: number): string {
  if (minutes === undefined || isNaN(minutes)) return "--:--";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Alias para timeToMinutes - converte "HH:MM" para minutos desde meia-noite.
 * Compatível com o padrão de nomenclatura do projeto.
 */
export function converterHoraParaMinutos(horaString: string): number {
  return timeToMinutes(horaString);
}

/**
 * Alias para minutesToTime - converte minutos desde meia-noite para "HH:MM".
 * Compatível com o padrão de nomenclatura do projeto.
 */
export function converterMinutosParaHora(minutosTotais: number): string {
  return minutesToTime(minutosTotais);
}

/**
 * Encontra o indice do primeiro horario estritamente maior que o alvo.
 * Retorna o tamanho do array quando nao existir horario futuro.
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
    const midVal = getVal(sortedArray[mid]);

    if (midVal > target) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }

  return left;
}

/**
 * Calcula o proximo e o anterior horario com base no horario atual.
 */
export function calculateNextAndPreviousSchedule(horarios: string[]) {
  if (!horarios || horarios.length === 0) {
    return { nextSchedule: "--:--", previousSchedule: "--:--" };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const schedulesInMinutes = horarios
    .filter((time) => time && time.includes(":"))
    .map(timeToMinutes)
    .sort((a, b) => a - b);

  if (schedulesInMinutes.length === 0) {
    return { nextSchedule: "--:--", previousSchedule: "--:--" };
  }

  let nextSchedule: string;
  let previousSchedule: string;

  const nextIndex = findScheduleIndex(schedulesInMinutes, currentMinutes);

  if (nextIndex < schedulesInMinutes.length) {
    nextSchedule = minutesToTime(schedulesInMinutes[nextIndex]);

    let prevIndex = nextIndex - 1;
    while (prevIndex >= 0 && schedulesInMinutes[prevIndex] >= currentMinutes) {
      prevIndex--;
    }

    if (prevIndex >= 0) {
      previousSchedule = minutesToTime(schedulesInMinutes[prevIndex]);
    } else {
      previousSchedule = minutesToTime(
        schedulesInMinutes[schedulesInMinutes.length - 1],
      );
    }
  } else {
    nextSchedule = minutesToTime(schedulesInMinutes[0]);

    let prevIndex = schedulesInMinutes.length - 1;
    while (prevIndex >= 0 && schedulesInMinutes[prevIndex] >= currentMinutes) {
      prevIndex--;
    }
    if (prevIndex >= 0) {
      previousSchedule = minutesToTime(schedulesInMinutes[prevIndex]);
    } else {
      previousSchedule = minutesToTime(
        schedulesInMinutes[schedulesInMinutes.length - 1],
      );
    }
  }

  return { nextSchedule, previousSchedule };
}

const paradasCache = new WeakMap<object, Map<string, unknown>>();

/**
 * Busca paradas do itinerario usando os IDs fornecidos.
 */
export function buscarParadasPorIds<T extends { idParada: string }>(
  itinerarioParadasIds: string[],
  todasParadas: T[],
): T[] {
  let paradasMap = paradasCache.get(todasParadas) as Map<string, T> | undefined;

  if (!paradasMap) {
    paradasMap = new Map<string, T>();
    for (const parada of todasParadas) {
      paradasMap.set(parada.idParada, parada);
    }
    paradasCache.set(todasParadas, paradasMap);
  }

  return itinerarioParadasIds
    .map((idParada) => paradasMap!.get(idParada))
    .filter((p): p is T => p !== undefined);
}
