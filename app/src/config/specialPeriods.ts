/**
 * Configuração de períodos especiais (férias e recessos)
 *
 * Este arquivo centraliza a configuração de períodos especiais, facilitando
 * a manutenção e atualização das datas de férias e recessos.
 */

import { getSaoPauloDayOfWeek, getSaoPauloNow, toSaoPauloDate } from '../lib/time';

export interface SpecialPeriod {
  startDate: Date;
  endDate: Date;
  name: string;
  description: string;
  isActive: boolean;
}

/**
 * Lista de períodos especiais configurados para operação diferenciada.
 */
export const SPECIAL_PERIODS: SpecialPeriod[] = [
  {
    name: 'Férias de Verão 2025/2026',
    description: 'Período de férias e recessos',
    startDate: new Date(2025, 11, 15),
    endDate: new Date(2026, 2, 1),
    isActive: true,
  },
];

/**
 * Verifica se estamos atualmente em um período especial ativo
 * @returns {SpecialPeriod | null} O período especial ativo ou null se não houver nenhum
 */
export function getCurrentSpecialPeriod(): SpecialPeriod | null {
  const now = getSaoPauloNow();
  now.setHours(0, 0, 0, 0);

  for (const period of SPECIAL_PERIODS) {
    if (!period.isActive) continue;

    const start = toSaoPauloDate(new Date(period.startDate));
    start.setHours(0, 0, 0, 0);

    const end = toSaoPauloDate(new Date(period.endDate));
    end.setHours(23, 59, 59, 999);

    if (now >= start && now <= end) {
      return period;
    }
  }

  return null;
}

/**
 * Verifica se é um dia útil (segunda a sexta-feira)
 * @returns {boolean} true se for dia útil, false caso contrário
 */
export function isWeekday(): boolean {
  const today = getSaoPauloDayOfWeek(getSaoPauloNow());
  return today >= 1 && today <= 5;
}

/**
 * Verifica se devemos mostrar horários especiais de férias
 * @returns {boolean} true se estiver em período de férias E for dia útil
 */
export function shouldShowVacationSchedules(): boolean {
  const specialPeriod = getCurrentSpecialPeriod();
  return specialPeriod !== null && isWeekday();
}

/**
 * Verifica se devemos desabilitar horários regulares
 * @returns {boolean} true se estiver em período de férias (independente do dia)
 */
export function shouldDisableRegularSchedules(): boolean {
  return getCurrentSpecialPeriod() !== null;
}

/**
 * Retorna a categoria do dia atual para filtrar linhas corretas.
 * - "feriasRecessos": período de férias em dia útil
 * - "sabado": sábado fora de férias
 * - "diasUteis": padrão
 */
export function obterCategoriaDiaAtual(): string {
  const today = getSaoPauloDayOfWeek(getSaoPauloNow());
  const isSaturday = today === 6;
  const isWeekday = today >= 1 && today <= 5;
  const specialPeriod = getCurrentSpecialPeriod();
  if (specialPeriod && isWeekday) return 'feriasRecessos';
  if (isSaturday && !specialPeriod) return 'sabado';
  return 'diasUteis';
}

/**
 * Verifica se uma linha está circulando hoje com base na sua categoria.
 */
export function isLineAvailableToday(categoriaDia: string): boolean {
  const today = getSaoPauloDayOfWeek(getSaoPauloNow());
  const isSaturday = today === 6;
  const isSunday = today === 0;
  const isWeekday = today >= 1 && today <= 5;
  const isInVacationPeriod = shouldDisableRegularSchedules();

  return (
    (categoriaDia === 'diasUteis' && isWeekday && !isInVacationPeriod) ||
    (categoriaDia === 'sabado' && isSaturday && !isInVacationPeriod) ||
    (categoriaDia === 'feriasRecessos' && isInVacationPeriod && !isSaturday && !isSunday)
  );
}

/**
 * Retorna a mensagem descritiva de por que a linha não está circulando hoje.
 */
export function getLinhaNotRunningMessage(categoriaDia: string): string {
  const today = getSaoPauloDayOfWeek(getSaoPauloNow());
  const isSaturday = today === 6;
  const isSunday = today === 0;
  const isInVacationPeriod = shouldDisableRegularSchedules();

  if (categoriaDia === 'diasUteis') {
    if (isInVacationPeriod) return 'Linha suspensa durante férias';
    if (isSaturday) return 'Linha não circula aos sábados';
    if (isSunday) return 'Linha não circula aos domingos';
  }
  if (categoriaDia === 'sabado') {
    if (isInVacationPeriod) return 'Linha suspensa durante férias';
    return 'Linha circula apenas aos sábados';
  }
  if (categoriaDia === 'feriasRecessos') {
    if (!isInVacationPeriod) return 'Linha circula apenas durante férias';
    if (isSaturday || isSunday) return 'Linha não circula em fins de semana';
  }
  return 'Linha não está circulando';
}
