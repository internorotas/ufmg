/**
 * Configuração central de Analytics.
 *
 * Centraliza a leitura do VITE_GA_MEASUREMENT_ID para que todos os
 * módulos que precisam da ID usem uma única fonte de verdade.
 */

/** ID de Medição do Google Analytics 4 (ex: G-XXXXXXXXXX). */
export const GA_MEASUREMENT_ID: string | undefined = import.meta.env.VITE_GA_MEASUREMENT_ID;
