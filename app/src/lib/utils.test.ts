import { describe, expect, it } from 'vitest';
import {
  buscarParadasPorIds,
  calcularDistanciaKm,
  cn,
  converterHoraParaMinutos,
  converterMinutosParaHora,
  findScheduleIndex,
  normalizarNomeLinha,
} from './utils';

// ---------------------------------------------------------------------------
// cn (class merging)
// ---------------------------------------------------------------------------

describe('cn', () => {
  it('concatena classes simples', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('ignora valores falsy', () => {
    expect(cn('px-4', false && 'hidden', undefined, null)).toBe('px-4');
  });

  it('resolve conflitos do Tailwind (último vence)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});

// ---------------------------------------------------------------------------
// converterHoraParaMinutos
// ---------------------------------------------------------------------------

describe('converterHoraParaMinutos', () => {
  it('converte "00:00" para 0', () => {
    expect(converterHoraParaMinutos('00:00')).toBe(0);
  });

  it('converte "01:30" para 90', () => {
    expect(converterHoraParaMinutos('01:30')).toBe(90);
  });

  it('converte "23:59" para 1439', () => {
    expect(converterHoraParaMinutos('23:59')).toBe(1439);
  });

  it('retorna NaN para entrada vazia', () => {
    expect(converterHoraParaMinutos('')).toBeNaN();
  });

  it('retorna NaN quando não há dois-pontos', () => {
    expect(converterHoraParaMinutos('1234')).toBeNaN();
  });
});

// ---------------------------------------------------------------------------
// converterMinutosParaHora
// ---------------------------------------------------------------------------

describe('converterMinutosParaHora', () => {
  it('converte 0 para "00:00"', () => {
    expect(converterMinutosParaHora(0)).toBe('00:00');
  });

  it('converte 90 para "01:30"', () => {
    expect(converterMinutosParaHora(90)).toBe('01:30');
  });

  it('converte 1439 para "23:59"', () => {
    expect(converterMinutosParaHora(1439)).toBe('23:59');
  });

  it('normaliza valores maiores que 1440 (ciclo 24h)', () => {
    expect(converterMinutosParaHora(1440)).toBe('00:00');
    expect(converterMinutosParaHora(1530)).toBe('01:30');
  });

  it('retorna "--:--" para Infinity', () => {
    expect(converterMinutosParaHora(Infinity)).toBe('--:--');
  });

  it('retorna "--:--" para NaN', () => {
    expect(converterMinutosParaHora(NaN)).toBe('--:--');
  });
});

// ---------------------------------------------------------------------------
// calcularDistanciaKm (Haversine)
// ---------------------------------------------------------------------------

describe('calcularDistanciaKm', () => {
  it('retorna 0 para o mesmo ponto', () => {
    expect(calcularDistanciaKm(-19.87055, -43.96775, -19.87055, -43.96775)).toBe(0);
  });

  it('calcula distância aproximada entre UFMG e Praça da Liberdade (~7.5 km)', () => {
    const dist = calcularDistanciaKm(-19.87055, -43.96775, -19.9319, -43.9387);
    expect(dist).toBeGreaterThan(7);
    expect(dist).toBeLessThan(8);
  });

  it('é simétrica', () => {
    const d1 = calcularDistanciaKm(-19.87, -43.96, -19.93, -43.93);
    const d2 = calcularDistanciaKm(-19.93, -43.93, -19.87, -43.96);
    expect(d1).toBeCloseTo(d2, 10);
  });
});

// ---------------------------------------------------------------------------
// findScheduleIndex
// ---------------------------------------------------------------------------

describe('findScheduleIndex', () => {
  const schedules = [480, 540, 600, 660, 720]; // 8h, 9h, 10h, 11h, 12h

  it('retorna 0 quando o alvo é anterior a todos os horários', () => {
    expect(findScheduleIndex(schedules, 400)).toBe(0);
  });

  it('retorna o índice do próximo horário', () => {
    // 500 está entre 480 e 540 → próximo é índice 1 (540)
    expect(findScheduleIndex(schedules, 500)).toBe(1);
  });

  it('retorna schedules.length quando o alvo é posterior a todos', () => {
    expect(findScheduleIndex(schedules, 900)).toBe(schedules.length);
  });

  it('retorna o índice seguinte quando o alvo é igual a um horário', () => {
    // 540 exato → próximo é índice 2 (600), não o 540 que já passou
    expect(findScheduleIndex(schedules, 540)).toBe(2);
  });

  it('funciona com array vazio', () => {
    expect(findScheduleIndex([], 500)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// normalizarNomeLinha
// ---------------------------------------------------------------------------

describe('normalizarNomeLinha', () => {
  it('converte para minúsculas e remove acentos', () => {
    expect(normalizarNomeLinha('Circular Campi')).toBe('circular campi');
    expect(normalizarNomeLinha('Reitoria – ICA')).toBe('reitoria ica');
  });

  it('remove conteúdo entre parênteses', () => {
    expect(normalizarNomeLinha('Linha 1 (Especial)')).toBe('linha 1');
  });

  it('normaliza espaços', () => {
    expect(normalizarNomeLinha('  Linha   1  ')).toBe('linha 1');
  });
});

// ---------------------------------------------------------------------------
// buscarParadasPorIds
// ---------------------------------------------------------------------------

describe('buscarParadasPorIds', () => {
  const paradas = [
    { idParada: 'P01', nome: 'Reitoria' },
    { idParada: 'P02', nome: 'Biblioteca' },
    { idParada: 'P03', nome: 'ICEx' },
  ];

  it('retorna paradas na ordem dos IDs fornecidos', () => {
    const result = buscarParadasPorIds(['P03', 'P01'], paradas);
    expect(result.map((p) => p.idParada)).toEqual(['P03', 'P01']);
  });

  it('ignora IDs que não existem', () => {
    const result = buscarParadasPorIds(['P01', 'P99'], paradas);
    expect(result).toHaveLength(1);
    expect(result[0].idParada).toBe('P01');
  });

  it('retorna array vazio para lista vazia de IDs', () => {
    expect(buscarParadasPorIds([], paradas)).toEqual([]);
  });
});
