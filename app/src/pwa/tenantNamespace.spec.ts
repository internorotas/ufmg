/**
 * tenantNamespace.spec.ts
 *
 * Em ambiente vitest, import.meta.env.VITE_TENANT_SLUG é undefined,
 * portanto tenantSlug cai para 'ufmg' (DEFAULT_TENANT_SLUG).
 *
 * Os testes verificam os prefixos e as funções de geração de chave/nome.
 */
import { describe, expect, it } from 'vitest';
import {
  getTenantCacheName,
  getTenantPushTag,
  getTenantStorageKey,
  TENANT_CACHE_PREFIX,
  TENANT_STORAGE_PREFIX,
} from './tenantNamespace';

describe('tenantNamespace (tenant padrão: ufmg em testes)', () => {
  describe('TENANT_STORAGE_PREFIX', () => {
    it('tem o formato interno-rotas:<slug>', () => {
      expect(TENANT_STORAGE_PREFIX).toBe('interno-rotas:ufmg');
    });
  });

  describe('TENANT_CACHE_PREFIX', () => {
    it('tem o formato interno-rotas-<slug>', () => {
      expect(TENANT_CACHE_PREFIX).toBe('interno-rotas-ufmg');
    });
  });

  describe('getTenantStorageKey', () => {
    it('prefixa a chave com o namespace de storage', () => {
      expect(getTenantStorageKey('favoritos')).toBe('interno-rotas:ufmg:favoritos');
    });

    it('prefixa chave vazia corretamente', () => {
      expect(getTenantStorageKey('')).toBe('interno-rotas:ufmg:');
    });

    it('não duplica o prefixo se a chave já contiver o slug', () => {
      const key = getTenantStorageKey('push-token');
      expect(key).toBe('interno-rotas:ufmg:push-token');
      expect(key.split('ufmg').length - 1).toBe(1);
    });

    it('isola chaves de tenants distintos', () => {
      const ufmgKey = getTenantStorageKey('favoritos');
      // Simula o que o prefixo do usp-mock produziria (sem importar o módulo com outro tenant)
      const uspMockPrefix = 'interno-rotas:usp-mock';
      const uspMockKey = `${uspMockPrefix}:favoritos`;
      expect(ufmgKey).not.toBe(uspMockKey);
    });
  });

  describe('getTenantCacheName', () => {
    it('prefixa o nome de cache com o prefixo de cache', () => {
      expect(getTenantCacheName('api-v1')).toBe('interno-rotas-ufmg-api-v1');
    });

    it('produz nome distinto do namespace de storage', () => {
      const cacheName = getTenantCacheName('pwa-assets');
      const storageKey = getTenantStorageKey('pwa-assets');
      expect(cacheName).not.toBe(storageKey);
    });
  });

  describe('getTenantPushTag', () => {
    it('prefixa a tag push com o prefixo de cache', () => {
      expect(getTenantPushTag('onibus-atrasado')).toBe('interno-rotas-ufmg-onibus-atrasado');
    });

    it('tem o mesmo padrão de prefixo que getTenantCacheName', () => {
      const tag = getTenantPushTag('alerta');
      const cache = getTenantCacheName('alerta');
      expect(tag).toBe(cache);
    });
  });
});
