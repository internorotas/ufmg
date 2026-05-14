import { describe, expect, it } from 'vitest';
import { hashUserId } from './hashUserId';

describe('hashUserId', () => {
  it('gera hash SHA-256 determinístico por semana ISO', async () => {
    const first = await hashUserId(7, new Date('2026-05-11T12:00:00.000Z'));
    const second = await hashUserId(7, new Date('2026-05-12T08:00:00.000Z'));

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toBe(first);
  });

  it('muda o hash quando a semana muda', async () => {
    const currentWeek = await hashUserId(7, new Date('2026-05-11T12:00:00.000Z'));
    const nextWeek = await hashUserId(7, new Date('2026-05-18T12:00:00.000Z'));

    expect(nextWeek).not.toBe(currentWeek);
  });
});
