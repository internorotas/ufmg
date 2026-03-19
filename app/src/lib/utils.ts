/**
 * Utilitários para o Design System
 * Interno Rotas - UFMG
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Mescla classes CSS usando clsx e tailwind-merge.
 * Útil para combinar classes condicionais e evitar conflitos do Tailwind.
 *
 * @param inputs - Classes CSS a serem mescladas
 * @returns String com as classes mescladas e sem duplicatas
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
 * Converte horario no formato HH:MM em minutos desde meia-noite.
 */
export function converterHoraParaMinutos(horaString: string): number {
  if (!horaString) return NaN;

  const [horasTexto, minutosTexto] = horaString.split(":");
  const horas = Number(horasTexto);
  const minutos = Number(minutosTexto);

  if (Number.isNaN(horas) || Number.isNaN(minutos)) return NaN;

  return horas * 60 + minutos;
}

/**
 * Converte minutos desde meia-noite para HH:MM com padding de zeros.
 */
export function converterMinutosParaHora(minutosTotais: number): string {
  if (!Number.isFinite(minutosTotais)) return "--:--";

  const minutosNoDia = 24 * 60;
  const valorNormalizado = ((Math.floor(minutosTotais) % minutosNoDia) + minutosNoDia) % minutosNoDia;
  const horas = Math.floor(valorNormalizado / 60);
  const minutos = valorNormalizado % 60;

  return `${horas.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}`;
}

/**
 * Calcula a distância em quilômetros entre duas coordenadas geográficas
 * usando a fórmula de Haversine.
 *
 * @param lat1 - Latitude do ponto 1
 * @param lon1 - Longitude do ponto 1
 * @param lat2 - Latitude do ponto 2
 * @param lon2 - Longitude do ponto 2
 * @returns Distância em quilômetros
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
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return RAIO_TERRA_KM * c;
}
