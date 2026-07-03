/**
 * Configuração de períodos especiais (férias e recessos)
 *
 * Este arquivo centraliza a configuração de períodos especiais, facilitando
 * a manutenção e atualização das datas de férias e recessos.
 */

import { getSaoPauloDayOfWeek, getSaoPauloNow, toSaoPauloDate } from '../lib/time';
import { fetchSpecialPeriods } from '../services/api/specialPeriodsApi';
import { CategoriaDia } from '../types/data.types';

export interface SpecialPeriod {
  startDate: Date;
  endDate: Date;
  name: string;
  description: string;
  isActive: boolean;
}

/**
 * Fallback estático usado até a primeira sincronização com a API responder
 * (ou se ela falhar). A fonte de verdade é o calendário escolar da UFMG,
 * sincronizado no backend pelo módulo `academic-calendar` — ver
 * initSpecialPeriodsFromApi().
 */
export const SPECIAL_PERIODS: SpecialPeriod[] = [
  {
    name: 'Férias de Verão 2025/2026',
    description: 'Período de férias e recessos',
    startDate: new Date(2025, 11, 15),
    endDate: new Date(2026, 2, 1),
    isActive: false,
  },
  {
    name: 'Recesso de Julho 2026',
    description: 'Recesso acadêmico de meio de ano',
    startDate: new Date(2026, 6, 5),
    endDate: new Date(2026, 7, 2),
    isActive: true,
  },
];

let runtimePeriods: SpecialPeriod[] | null = null;
let runtimeHolidayDates: Set<string> | null = null;

function currentPeriods(): SpecialPeriod[] {
  return runtimePeriods ?? SPECIAL_PERIODS;
}

/**
 * Busca os períodos especiais (férias/recesso) e feriados sincronizados a
 * partir do calendário escolar da UFMG e substitui o fallback estático.
 * Deve ser chamada uma vez na inicialização do app (ver main.tsx). Falhas de
 * rede são silenciosas — o fallback hardcoded continua valendo.
 */
export async function initSpecialPeriodsFromApi(): Promise<void> {
  try {
    const items = await fetchSpecialPeriods();
    const periods: SpecialPeriod[] = [];
    const holidayDates = new Set<string>();

    for (const item of items) {
      if (item.tipo === 'feriado') {
        holidayDates.add(item.dataInicio.slice(0, 10));
        continue;
      }
      if (item.tipo === 'ferias' || item.tipo === 'recesso') {
        periods.push({
          name: item.nome,
          description: item.nome,
          startDate: new Date(item.dataInicio),
          endDate: new Date(item.dataFim),
          isActive: true,
        });
      }
    }

    runtimePeriods = periods;
    runtimeHolidayDates = holidayDates;
  } catch {
    // Mantém o fallback estático (SPECIAL_PERIODS / sem feriados isolados).
  }
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Verifica se hoje é um feriado isolado (ex: Tiradentes) sincronizado do
 * calendário escolar da UFMG. Diferente de um período de férias/recesso:
 * é um único dia em que as linhas não circulam mesmo sendo dia útil.
 */
export function isHolidayToday(): boolean {
  if (!runtimeHolidayDates) return false;
  return runtimeHolidayDates.has(formatDateKey(getSaoPauloNow()));
}

/**
 * Verifica se estamos atualmente em um período especial ativo
 * @returns {SpecialPeriod | null} O período especial ativo ou null se não houver nenhum
 */
export function getCurrentSpecialPeriod(): SpecialPeriod | null {
  // Cria novo Date para não mutar o objeto retornado por getSaoPauloNow()
  const nowSp = getSaoPauloNow();
  const now = new Date(nowSp.getFullYear(), nowSp.getMonth(), nowSp.getDate(), 0, 0, 0, 0);

  for (const period of currentPeriods()) {
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
 */
export function obterCategoriaDiaAtual(): CategoriaDia {
  const today = getSaoPauloDayOfWeek(getSaoPauloNow());
  const isSaturday = today === 6;
  const isWeekday = today >= 1 && today <= 5;
  const specialPeriod = getCurrentSpecialPeriod();
  if (specialPeriod && isWeekday) return CategoriaDia.FeriasERecessos;
  if (isSaturday && !specialPeriod) return CategoriaDia.Sabado;
  return CategoriaDia.DiasUteis;
}

/**
 * Verifica se uma linha está circulando hoje com base na sua categoria.
 */
export function isLineAvailableToday(categoriaDia: CategoriaDia): boolean {
  const today = getSaoPauloDayOfWeek(getSaoPauloNow());
  const isSaturday = today === 6;
  const isSunday = today === 0;
  const isWeekday = today >= 1 && today <= 5;
  const isInVacationPeriod = shouldDisableRegularSchedules();
  const isHoliday = isHolidayToday();

  return (
    (categoriaDia === CategoriaDia.DiasUteis && isWeekday && !isInVacationPeriod && !isHoliday) ||
    (categoriaDia === CategoriaDia.Sabado && isSaturday && !isInVacationPeriod && !isHoliday) ||
    (categoriaDia === CategoriaDia.FeriasERecessos &&
      isInVacationPeriod &&
      !isSaturday &&
      !isSunday)
  );
}

/**
 * Retorna a mensagem descritiva de por que a linha não está circulando hoje.
 */
export function getLinhaNotRunningMessage(categoriaDia: CategoriaDia): string {
  const today = getSaoPauloDayOfWeek(getSaoPauloNow());
  const isSaturday = today === 6;
  const isSunday = today === 0;
  const isInVacationPeriod = shouldDisableRegularSchedules();
  const isHoliday = isHolidayToday();

  switch (categoriaDia) {
    case CategoriaDia.DiasUteis:
      if (isInVacationPeriod) return 'Linha suspensa durante férias';
      if (isHoliday) return 'Linha não circula em feriado';
      if (isSaturday) return 'Linha não circula aos sábados';
      if (isSunday) return 'Linha não circula aos domingos';
      break;
    case CategoriaDia.Sabado:
      if (isInVacationPeriod) return 'Linha suspensa durante férias';
      if (isHoliday) return 'Linha não circula em feriado';
      return 'Linha circula apenas aos sábados';
    case CategoriaDia.FeriasERecessos:
      if (!isInVacationPeriod) return 'Linha circula apenas durante férias';
      if (isSaturday || isSunday) return 'Linha não circula em fins de semana';
      break;
  }
  return 'Linha não está circulando';
}
