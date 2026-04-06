import { afterEach, describe, expect, it, vi } from 'vitest';

// We mock the entire time module so we can control "now" without depending on
// the system clock or the São Paulo timezone of the test runner.
vi.mock('../lib/time', async (importOriginal) => {
  const real = await importOriginal<typeof import('../lib/time')>();
  return {
    ...real,
    // getSaoPauloNow will be replaced per test via vi.mocked()
    getSaoPauloNow: vi.fn(),
  };
});

import * as timeMod from '../lib/time';
import {
  getCurrentSpecialPeriod,
  getLinhaNotRunningMessage,
  isLineAvailableToday,
  isWeekday,
  obterCategoriaDiaAtual,
  shouldDisableRegularSchedules,
  shouldShowVacationSchedules,
} from './specialPeriods';

// ---------------------------------------------------------------------------
// Helper: constrói uma Date local com hora zerada (como getSaoPauloNow faz)
// ---------------------------------------------------------------------------

function makeDay(year: number, month: number, day: number, _dayOfWeek?: number): Date {
  // We construct a local Date whose getDay() matches dayOfWeek when provided.
  // month is 1-indexed for readability.
  const d = new Date(year, month - 1, day, 0, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// getCurrentSpecialPeriod
// ---------------------------------------------------------------------------

describe('getCurrentSpecialPeriod', () => {
  afterEach(() => vi.restoreAllMocks());

  it('retorna null quando não há período especial ativo na data', () => {
    // 2025-06-01: antes de qualquer período ativo
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2025, 6, 1));
    expect(getCurrentSpecialPeriod()).toBeNull();
  });

  it('retorna o período ativo quando a data cai dentro do intervalo', () => {
    // Recesso de Julho 2026: 2026-07-05 a 2026-08-02, isActive: true
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 15));
    const period = getCurrentSpecialPeriod();
    expect(period).not.toBeNull();
    expect(period?.name).toBe('Recesso de Julho 2026');
  });

  it('retorna null no dia exatamente antes do início do período', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 4));
    expect(getCurrentSpecialPeriod()).toBeNull();
  });

  it('retorna o período no último dia (endDate inclusivo)', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 8, 2));
    expect(getCurrentSpecialPeriod()).not.toBeNull();
  });

  it('retorna null no dia seguinte ao fim do período', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 8, 3));
    expect(getCurrentSpecialPeriod()).toBeNull();
  });

  it('ignora períodos com isActive: false (Férias de Verão 2025/2026)', () => {
    // 2026-01-10 cai dentro do período de férias, mas isActive = false
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 1, 10));
    expect(getCurrentSpecialPeriod()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isWeekday
// ---------------------------------------------------------------------------

describe('isWeekday', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['segunda', 1, true],
    ['terça', 2, true],
    ['quarta', 3, true],
    ['quinta', 4, true],
    ['sexta', 5, true],
    ['sábado', 6, false],
    ['domingo', 0, false],
  ])('%s (getDay=%i) → %s', (_label, dayOfWeek, expected) => {
    const d = new Date(2026, 6, 5); // base: domingo 5 jul 2026
    // Advance to desired day
    d.setDate(5 + (dayOfWeek === 0 ? 0 : dayOfWeek));
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(d);
    expect(isWeekday()).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// shouldShowVacationSchedules & shouldDisableRegularSchedules
// ---------------------------------------------------------------------------

describe('shouldShowVacationSchedules', () => {
  afterEach(() => vi.restoreAllMocks());

  it('retorna true quando em período de férias E dia útil', () => {
    // 2026-07-06 é segunda-feira (dentro do Recesso de Julho)
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 6));
    expect(shouldShowVacationSchedules()).toBe(true);
  });

  it('retorna false quando em período de férias MAS sábado', () => {
    // 2026-07-11 é sábado
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 11));
    expect(shouldShowVacationSchedules()).toBe(false);
  });

  it('retorna false quando fora de período de férias em dia útil', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 1)); // setembro
    expect(shouldShowVacationSchedules()).toBe(false);
  });
});

describe('shouldDisableRegularSchedules', () => {
  afterEach(() => vi.restoreAllMocks());

  it('retorna true em qualquer dia dentro do período ativo', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 11)); // sábado
    expect(shouldDisableRegularSchedules()).toBe(true);
  });

  it('retorna false fora de qualquer período ativo', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 1));
    expect(shouldDisableRegularSchedules()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// obterCategoriaDiaAtual
// ---------------------------------------------------------------------------

describe('obterCategoriaDiaAtual', () => {
  afterEach(() => vi.restoreAllMocks());

  it('retorna "feriasRecessos" em dia útil dentro do recesso', () => {
    // 2026-07-06 segunda
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 6));
    expect(obterCategoriaDiaAtual()).toBe('feriasRecessos');
  });

  it('retorna "sabado" em sábado fora do recesso', () => {
    // 2026-09-05 sábado
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 5));
    expect(obterCategoriaDiaAtual()).toBe('sabado');
  });

  it('retorna "diasUteis" em dia útil fora do recesso', () => {
    // 2026-09-07 segunda
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 7));
    expect(obterCategoriaDiaAtual()).toBe('diasUteis');
  });

  it('retorna "diasUteis" em domingo (não é sabado nem recesso em dia útil)', () => {
    // 2026-09-06 domingo
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 6));
    expect(obterCategoriaDiaAtual()).toBe('diasUteis');
  });
});

// ---------------------------------------------------------------------------
// isLineAvailableToday
// ---------------------------------------------------------------------------

describe('isLineAvailableToday', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('linha "diasUteis"', () => {
    it('disponível em dia útil fora do recesso', () => {
      vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 7)); // segunda
      expect(isLineAvailableToday('diasUteis')).toBe(true);
    });

    it('indisponível em dia útil durante recesso', () => {
      vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 6)); // segunda no recesso
      expect(isLineAvailableToday('diasUteis')).toBe(false);
    });

    it('indisponível no sábado fora do recesso', () => {
      vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 5)); // sábado
      expect(isLineAvailableToday('diasUteis')).toBe(false);
    });
  });

  describe('linha "sabado"', () => {
    it('disponível no sábado fora do recesso', () => {
      vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 5)); // sábado
      expect(isLineAvailableToday('sabado')).toBe(true);
    });

    it('indisponível no sábado durante recesso', () => {
      vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 11)); // sábado no recesso
      expect(isLineAvailableToday('sabado')).toBe(false);
    });

    it('indisponível em dia útil fora do recesso', () => {
      vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 7)); // segunda
      expect(isLineAvailableToday('sabado')).toBe(false);
    });
  });

  describe('linha "feriasRecessos"', () => {
    it('disponível em dia útil durante recesso', () => {
      vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 6)); // segunda no recesso
      expect(isLineAvailableToday('feriasRecessos')).toBe(true);
    });

    it('indisponível no sábado durante recesso', () => {
      vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 11)); // sábado no recesso
      expect(isLineAvailableToday('feriasRecessos')).toBe(false);
    });

    it('indisponível em dia útil fora do recesso', () => {
      vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 7)); // segunda
      expect(isLineAvailableToday('feriasRecessos')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// getLinhaNotRunningMessage
// ---------------------------------------------------------------------------

describe('getLinhaNotRunningMessage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('linha diasUteis — suspensa durante férias (dia útil no recesso)', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 6));
    expect(getLinhaNotRunningMessage('diasUteis')).toBe('Linha suspensa durante férias');
  });

  it('linha diasUteis — não circula aos sábados', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 5)); // sábado fora recesso
    expect(getLinhaNotRunningMessage('diasUteis')).toBe('Linha não circula aos sábados');
  });

  it('linha diasUteis — não circula aos domingos', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 6)); // domingo
    expect(getLinhaNotRunningMessage('diasUteis')).toBe('Linha não circula aos domingos');
  });

  it('linha sabado — suspensa durante férias', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 11)); // sábado no recesso
    expect(getLinhaNotRunningMessage('sabado')).toBe('Linha suspensa durante férias');
  });

  it('linha sabado — circula apenas aos sábados (dia útil fora recesso)', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 7)); // segunda
    expect(getLinhaNotRunningMessage('sabado')).toBe('Linha circula apenas aos sábados');
  });

  it('linha feriasRecessos — circula apenas durante férias (fora do recesso)', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 7)); // segunda
    expect(getLinhaNotRunningMessage('feriasRecessos')).toBe('Linha circula apenas durante férias');
  });

  it('linha feriasRecessos — não circula em fins de semana (sábado no recesso)', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 7, 11)); // sábado no recesso
    expect(getLinhaNotRunningMessage('feriasRecessos')).toBe('Linha não circula em fins de semana');
  });

  it('retorna mensagem genérica para categoria desconhecida', () => {
    vi.mocked(timeMod.getSaoPauloNow).mockReturnValue(makeDay(2026, 9, 7));
    expect(getLinhaNotRunningMessage('inexistente')).toBe('Linha não está circulando');
  });
});
