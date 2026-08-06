import { describe, expect, it } from 'vitest';
import {
  BUILDING_BASE_EXPRESSION,
  BUILDING_HEIGHT_EXPRESSION,
  FALLBACK_HEIGHT_BY_AMENITY_M,
} from './MapLibrePrediosLayer';

describe('altura 3D dos prédios — expressão data-driven, não fixa', () => {
  it('fallback por categoria cobre as amenidades conhecidas com alturas plausíveis', () => {
    expect(FALLBACK_HEIGHT_BY_AMENITY_M.university).toBeGreaterThan(
      FALLBACK_HEIGHT_BY_AMENITY_M.toilets,
    );
    expect(FALLBACK_HEIGHT_BY_AMENITY_M.hospital).toBeGreaterThan(0);
    expect(Object.values(FALLBACK_HEIGHT_BY_AMENITY_M).every((h) => h > 0)).toBe(true);
  });

  it('fill-extrusion-height é uma expressão `case` (nunca um número fixo único)', () => {
    expect(Array.isArray(BUILDING_HEIGHT_EXPRESSION)).toBe(true);
    expect(BUILDING_HEIGHT_EXPRESSION[0]).toBe('case');
    // prioridade: height > buildingLevels > fallback por categoria
    const serialized = JSON.stringify(BUILDING_HEIGHT_EXPRESSION);
    expect(serialized).toContain('"height"');
    expect(serialized).toContain('"buildingLevels"');
    expect(serialized).toContain('"match"');
    expect(serialized).toContain('"amenity"');
  });

  it('fill-extrusion-base lê `minHeight` das properties, com fallback 0', () => {
    expect(Array.isArray(BUILDING_BASE_EXPRESSION)).toBe(true);
    expect(BUILDING_BASE_EXPRESSION[0]).toBe('case');
    expect(JSON.stringify(BUILDING_BASE_EXPRESSION)).toContain('"minHeight"');
  });
});
