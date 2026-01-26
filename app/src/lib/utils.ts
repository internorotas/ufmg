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
