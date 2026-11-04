import { describe, expect, it } from 'vitest';
import { normalizeLoginDestination } from './loginDestination';

describe('normalizeLoginDestination', () => {
  it('preserva somente destinos relativos da aplicacao', () => {
    expect(normalizeLoginDestination('/perfil?tab=apoio#historico')).toBe(
      '/perfil?tab=apoio#historico',
    );
  });

  it.each([
    'https://evil.example/path',
    '//evil.example/path',
    '/\\evil.example/path',
    '/%5Cevil.example/path',
    '/%252F%252Fevil.example/path',
    '/..//evil.example/path',
    '/%00evil.example/path',
    '%E0%A4%A',
  ])('substitui destino inseguro por raiz: %s', (destination) => {
    expect(normalizeLoginDestination(destination)).toBe('/');
  });
});
