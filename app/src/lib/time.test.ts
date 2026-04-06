import { describe, expect, it } from 'vitest';
import { getSaoPauloDayOfWeek, getSaoPauloMinutesOfDay, toSaoPauloDate } from './time';

// ---------------------------------------------------------------------------
// toSaoPauloDate
// ---------------------------------------------------------------------------

describe('toSaoPauloDate', () => {
  it('converte um instante UTC para a data local de São Paulo (UTC-3)', () => {
    // 2026-07-10 03:00:00 UTC  →  2026-07-10 00:00:00 BRT
    const utc = new Date('2026-07-10T03:00:00Z');
    const sp = toSaoPauloDate(utc);
    expect(sp.getFullYear()).toBe(2026);
    expect(sp.getMonth()).toBe(6); // julho = índice 6
    expect(sp.getDate()).toBe(10);
    expect(sp.getHours()).toBe(0);
    expect(sp.getMinutes()).toBe(0);
    expect(sp.getSeconds()).toBe(0);
  });

  it('atravessa a virada de meia-noite corretamente', () => {
    // 2026-07-11 02:59:59 UTC  →  2026-07-10 23:59:59 BRT
    const utc = new Date('2026-07-11T02:59:59Z');
    const sp = toSaoPauloDate(utc);
    expect(sp.getDate()).toBe(10);
    expect(sp.getHours()).toBe(23);
    expect(sp.getMinutes()).toBe(59);
    expect(sp.getSeconds()).toBe(59);
  });

  it('preserva data quando UTC e SP já estão no mesmo dia', () => {
    // 2026-07-10 12:00:00 UTC  →  2026-07-10 09:00:00 BRT
    const utc = new Date('2026-07-10T12:00:00Z');
    const sp = toSaoPauloDate(utc);
    expect(sp.getDate()).toBe(10);
    expect(sp.getHours()).toBe(9);
  });

  it('aplica horário de verão (BRST = UTC-2) quando vigente', () => {
    // No Brasil, horário de verão foi abolido em 2019. Verificamos que a função
    // usa Intl.DateTimeFormat e, portanto, reflete as regras históricas corretas.
    // 2018-11-05T04:00:00Z era BRST (UTC-2) → 02:00 local
    const utc = new Date('2018-11-05T04:00:00Z');
    const sp = toSaoPauloDate(utc);
    // BRST = UTC-2: 04:00Z → 02:00 local
    expect(sp.getHours()).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getSaoPauloMinutesOfDay
// ---------------------------------------------------------------------------

describe('getSaoPauloMinutesOfDay', () => {
  it('retorna 0 para meia-noite em SP', () => {
    // 2026-07-10 03:00:00 UTC = 2026-07-10 00:00:00 BRT
    const utc = new Date('2026-07-10T03:00:00Z');
    expect(getSaoPauloMinutesOfDay(utc)).toBe(0);
  });

  it('retorna 60 para 01:00 BRT', () => {
    // 2026-07-10 04:00:00 UTC = 2026-07-10 01:00:00 BRT
    const utc = new Date('2026-07-10T04:00:00Z');
    expect(getSaoPauloMinutesOfDay(utc)).toBe(60);
  });

  it('retorna 480 para 08:00 BRT', () => {
    // 2026-07-10 11:00:00 UTC = 2026-07-10 08:00:00 BRT
    const utc = new Date('2026-07-10T11:00:00Z');
    expect(getSaoPauloMinutesOfDay(utc)).toBe(480);
  });

  it('retorna 1439 para 23:59 BRT', () => {
    // 2026-07-11 02:59:00 UTC = 2026-07-10 23:59:00 BRT
    const utc = new Date('2026-07-11T02:59:00Z');
    expect(getSaoPauloMinutesOfDay(utc)).toBe(1439);
  });

  it('resultado está sempre no intervalo [0, 1439]', () => {
    // Testa vários instantes UTC aleatórios
    const offsets = [0, 1, 60, 180, 360, 480, 720, 1080, 1380, 1439];
    for (const offset of offsets) {
      const utc = new Date(Date.UTC(2026, 6, 10, 0, 0, 0) + offset * 60_000);
      const result = getSaoPauloMinutesOfDay(utc);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1439);
    }
  });
});

// ---------------------------------------------------------------------------
// getSaoPauloDayOfWeek
// ---------------------------------------------------------------------------

describe('getSaoPauloDayOfWeek', () => {
  it('retorna 5 (sexta) para 2026-07-10 (sexta) em SP', () => {
    // 2026-07-10 é uma sexta-feira
    const utc = new Date('2026-07-10T12:00:00Z');
    expect(getSaoPauloDayOfWeek(utc)).toBe(5);
  });

  it('retorna 0 (domingo) para 2026-07-12 em SP', () => {
    const utc = new Date('2026-07-12T12:00:00Z');
    expect(getSaoPauloDayOfWeek(utc)).toBe(0);
  });

  it('retorna 6 (sábado) para 2026-07-11 em SP', () => {
    const utc = new Date('2026-07-11T12:00:00Z');
    expect(getSaoPauloDayOfWeek(utc)).toBe(6);
  });

  it('retorna o dia SP mesmo que UTC já seja dia seguinte', () => {
    // 2026-07-11 01:00 UTC = 2026-07-10 22:00 BRT → sexta (5)
    const utc = new Date('2026-07-11T01:00:00Z');
    expect(getSaoPauloDayOfWeek(utc)).toBe(5);
  });
});
