import { describe, expect, it } from 'vitest';
import { resolveCollectionIntervalMs, shouldAutoFinish, trimQueue } from './useGpsTrackingSession';

describe('useGpsTrackingSession helpers', () => {
  describe('resolveCollectionIntervalMs', () => {
    it('diferencia janelas de 5s e 30s pela velocidade', () => {
      expect(resolveCollectionIntervalMs(4)).toBe(5000);
      expect(resolveCollectionIntervalMs(0)).toBe(30000);
    });

    it('limiar de 3 km/h: exatamente 3 usa intervalo longo', () => {
      expect(resolveCollectionIntervalMs(3)).toBe(30000);
    });

    it('acima de 3 km/h usa intervalo curto', () => {
      expect(resolveCollectionIntervalMs(3.1)).toBe(5000);
    });
  });

  describe('trimQueue', () => {
    it('limita a fila local a 500 pontos FIFO', () => {
      const queue = Array.from({ length: 520 }, (_, index) => index);
      const trimmed = trimQueue(queue, 500);

      expect(trimmed).toHaveLength(500);
      expect(trimmed[0]).toBe(20);
      expect(trimmed[trimmed.length - 1]).toBe(519);
    });

    it('não corta quando abaixo do limite', () => {
      const queue = [1, 2, 3];
      expect(trimQueue(queue, 500)).toEqual([1, 2, 3]);
    });

    it('fila vazia retorna vazia', () => {
      expect(trimQueue([], 500)).toEqual([]);
    });

    it('exatamente no limite não corta', () => {
      const queue = Array.from({ length: 500 }, (_, i) => i);
      const trimmed = trimQueue(queue, 500);
      expect(trimmed).toHaveLength(500);
      expect(trimmed[0]).toBe(0);
    });
  });

  describe('shouldAutoFinish', () => {
    it('não encerra automaticamente porque a velocidade ficou zero', () => {
      const result = shouldAutoFinish({
        sessionStartedAt: 0,
        now: 5 * 60 * 1000,
      });

      expect(result).toBeNull();
    });

    it('encerra automaticamente por timeout de 1h', () => {
      const result = shouldAutoFinish({
        sessionStartedAt: 0,
        now: 60 * 60 * 1000,
      });

      expect(result).toBe('timeout');
    });

    it('mantém o timeout como limite de segurança', () => {
      expect(
        shouldAutoFinish({
          sessionStartedAt: 0,
          now: 60 * 60 * 1000,
        }),
      ).toBe('timeout');
    });

    it('não encerra uma sessão curta sem movimento detectado', () => {
      expect(
        shouldAutoFinish({
          sessionStartedAt: 0,
          now: 10 * 60 * 1000,
        }),
      ).toBeNull();
    });

    it('não encerra uma sessão curta', () => {
      expect(
        shouldAutoFinish({
          sessionStartedAt: 0,
          now: 4 * 60 * 1000 + 59_000,
        }),
      ).toBeNull();
    });

    it('não encerra se a sessão tem menos de 1h', () => {
      expect(
        shouldAutoFinish({
          sessionStartedAt: 0,
          now: 59 * 60 * 1000 + 59_000, // 59m59s — abaixo do timeout de 1h
        }),
      ).toBeNull();
    });
  });
});
