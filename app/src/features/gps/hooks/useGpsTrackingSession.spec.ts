import { describe, expect, it } from 'vitest';
import { resolveCollectionIntervalMs, shouldAutoFinish, trimQueue } from './useGpsTrackingSession';

describe('useGpsTrackingSession helpers', () => {
  it('diferencia janelas de 5s e 30s pela velocidade', () => {
    expect(resolveCollectionIntervalMs(4)).toBe(5000);
    expect(resolveCollectionIntervalMs(0)).toBe(30000);
  });

  it('limita a fila local a 500 pontos FIFO', () => {
    const queue = Array.from({ length: 520 }, (_, index) => index);
    const trimmed = trimQueue(queue, 500);

    expect(trimmed).toHaveLength(500);
    expect(trimmed[0]).toBe(20);
    expect(trimmed[trimmed.length - 1]).toBe(519);
  });

  it('encerra automaticamente por inatividade', () => {
    const result = shouldAutoFinish({
      sessionStartedAt: 0,
      lastMovementAt: 0,
      now: 5 * 60 * 1000,
    });

    expect(result).toBe('parado');
  });

  it('encerra automaticamente por timeout de 1h', () => {
    const result = shouldAutoFinish({
      sessionStartedAt: 0,
      lastMovementAt: 10_000,
      now: 60 * 60 * 1000,
    });

    expect(result).toBe('timeout');
  });
});
