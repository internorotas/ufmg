import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TENANT_SLUG,
  TENANT_DEFINITIONS,
  normalizeTenantSlug,
  resolveTenantDefinition,
} from './tenantDefinitions';

describe('normalizeTenantSlug', () => {
  it('retorna o default quando valor é undefined', () => {
    expect(normalizeTenantSlug(undefined)).toBe(DEFAULT_TENANT_SLUG);
  });

  it('retorna o default quando valor é null', () => {
    expect(normalizeTenantSlug(null)).toBe(DEFAULT_TENANT_SLUG);
  });

  it('retorna o default quando valor é string vazia', () => {
    expect(normalizeTenantSlug('')).toBe(DEFAULT_TENANT_SLUG);
  });

  it('retorna o default quando valor é só espaços', () => {
    expect(normalizeTenantSlug('   ')).toBe(DEFAULT_TENANT_SLUG);
  });

  it('normaliza para minúsculas', () => {
    expect(normalizeTenantSlug('UFMG')).toBe('ufmg');
    expect(normalizeTenantSlug('USP-MOCK')).toBe('usp-mock');
  });

  it('remove espaços laterais', () => {
    expect(normalizeTenantSlug('  ufmg  ')).toBe('ufmg');
  });

  it('preserva o valor se já normalizado', () => {
    expect(normalizeTenantSlug('ufmg')).toBe('ufmg');
    expect(normalizeTenantSlug('usp-mock')).toBe('usp-mock');
  });
});

describe('resolveTenantDefinition', () => {
  it('retorna a definição da UFMG para o slug "ufmg"', () => {
    const def = resolveTenantDefinition('ufmg');
    expect(def.slug).toBe('ufmg');
    expect(def.institutionName).toBe('Universidade Federal de Minas Gerais');
    expect(def.cityName).toBe('Belo Horizonte');
    expect(def.brandColor).toBe('#2c0eeb');
  });

  it('retorna a definição do usp-mock para o slug "usp-mock"', () => {
    const def = resolveTenantDefinition('usp-mock');
    expect(def.slug).toBe('usp-mock');
    expect(def.institutionName).toBe('Universidade de São Paulo');
    expect(def.cityName).toBe('São Paulo');
    expect(def.brandColor).toBe('#8b1d3b');
  });

  it('normaliza para minúsculas antes de resolver (USP-MOCK → usp-mock)', () => {
    const def = resolveTenantDefinition('USP-MOCK');
    expect(def.slug).toBe('usp-mock');
  });

  it('cai no fallback ufmg para slug desconhecido', () => {
    const def = resolveTenantDefinition('tenant-inexistente');
    expect(def.slug).toBe(DEFAULT_TENANT_SLUG);
  });

  it('cai no fallback ufmg para undefined', () => {
    const def = resolveTenantDefinition(undefined);
    expect(def.slug).toBe(DEFAULT_TENANT_SLUG);
  });

  it('cai no fallback ufmg para null', () => {
    const def = resolveTenantDefinition(null);
    expect(def.slug).toBe(DEFAULT_TENANT_SLUG);
  });

  it('isolamento: ufmg e usp-mock têm campusCenter distintos', () => {
    const ufmg = resolveTenantDefinition('ufmg');
    const usp = resolveTenantDefinition('usp-mock');
    expect(ufmg.campusCenter).not.toEqual(usp.campusCenter);
  });

  it('isolamento: ufmg e usp-mock têm basePath distintos', () => {
    const ufmg = resolveTenantDefinition('ufmg');
    const usp = resolveTenantDefinition('usp-mock');
    expect(ufmg.basePath).not.toBe(usp.basePath);
    expect(ufmg.basePath).toBe('/ufmg/');
    expect(usp.basePath).toBe('/usp-mock/');
  });

  it('retorna sempre um objeto (nunca null ou undefined)', () => {
    for (const slug of [null, undefined, '', 'nao-existe', 'ufmg', 'usp-mock'] as const) {
      expect(resolveTenantDefinition(slug)).toBeTruthy();
    }
  });
});

describe('TENANT_DEFINITIONS', () => {
  it('contém ufmg e usp-mock', () => {
    expect(Object.keys(TENANT_DEFINITIONS)).toContain('ufmg');
    expect(Object.keys(TENANT_DEFINITIONS)).toContain('usp-mock');
  });

  it('todos os tenants possuem slug coerente com a chave', () => {
    for (const [key, def] of Object.entries(TENANT_DEFINITIONS)) {
      expect(def.slug).toBe(key);
    }
  });

  it('todos os tenants possuem basePath no formato /slug/', () => {
    for (const def of Object.values(TENANT_DEFINITIONS)) {
      expect(def.basePath).toMatch(/^\/[a-z0-9-]+\/$/);
    }
  });
});
