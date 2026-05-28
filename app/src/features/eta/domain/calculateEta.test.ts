import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Linha } from '@/types/data.types';
import { calcularPrevisaoChegada } from './calculateEta';

function buildLinha(overrides: Partial<Linha> = {}): Linha {
  return {
    idRota: 'DU10',
    linha: 10,
    nome: 'Circular Interna',
    tipo: 'circular',
    sublinha: null,
    categoriaDia: 'diasUteis',
    corHex: '#2c0eeb',
    descricao: 'Linha de teste para ETA',
    horarios: ['10:00', '10:30'],
    itinerarioParadasIds: ['P01'],
    trajetoDetalhado: [
      {
        idParada: 'P01',
        tempoDoAnteriorMinutos: 10,
      },
    ],
    coordenadasTrajeto: [[-19.8698, -43.9649]],
    ...overrides,
  };
}

describe('calcularPrevisaoChegada', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-07T15:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna null quando a linha não circula no dia atual', () => {
    const linhaSabado = buildLinha({ categoriaDia: 'sabado' });

    const resultado = calcularPrevisaoChegada(linhaSabado, 'P01', new Date('2026-09-07T15:00:00Z'));

    expect(resultado).toBeNull();
  });

  it('retorna null quando a parada não existe no trajeto detalhado', () => {
    const linha = buildLinha();

    const resultado = calcularPrevisaoChegada(linha, 'P99', new Date('2026-09-07T15:00:00Z'));

    expect(resultado).toBeNull();
  });

  it('calcula próximo ônibus e ônibus anterior corretamente', () => {
    const linha = buildLinha();

    const resultado = calcularPrevisaoChegada(linha, 'P01', new Date('2026-09-07T13:20:00Z'));

    expect(resultado).not.toBeNull();
    expect(resultado?.proximoOnibus?.horarioChegada).toBe('10:40');
    expect(resultado?.proximoOnibus?.minutosFaltantes).toBe(20);
    expect(resultado?.onibusAnterior?.minutosQuePassou).toBe(10);
    expect(resultado?.isTrafegoIntenso).toBe(false);
  });

  it('ajusta corretamente a ETA na virada da meia-noite', () => {
    const linha = buildLinha({
      horarios: ['23:50'],
      trajetoDetalhado: [
        {
          idParada: 'P01',
          tempoDoAnteriorMinutos: 20,
        },
      ],
    });

    const resultado = calcularPrevisaoChegada(linha, 'P01', new Date('2026-09-08T02:55:00Z'));

    expect(resultado).not.toBeNull();
    expect(resultado?.proximoOnibus?.horarioChegada).toBe('00:10');
    expect(resultado?.proximoOnibus?.minutosFaltantes).toBe(15);
  });

  it('marca tráfego intenso quando multiplicador é maior que 1.0', () => {
    const linha = buildLinha({
      horarios: ['17:00'],
      trajetoDetalhado: [
        {
          idParada: 'P01',
          tempoDoAnteriorMinutos: 10,
          isTrechoExterno: true,
        },
      ],
    });

    const resultado = calcularPrevisaoChegada(linha, 'P01', new Date('2026-09-07T20:05:00Z'));

    expect(resultado).not.toBeNull();
    expect(resultado?.isTrafegoIntenso).toBe(true);
    expect(resultado?.proximoOnibus?.horarioChegada).toBe('17:13');
    expect(resultado?.proximoOnibus?.minutosFaltantes).toBe(8);
  });
});
