import { tenantSlug } from '@/tenants/tenantConfig';

export const TENANT_STORAGE_PREFIX = `interno-rotas:${tenantSlug}`;
export const TENANT_CACHE_PREFIX = `interno-rotas-${tenantSlug}`;

export function getTenantStorageKey(key: string): string {
  return `${TENANT_STORAGE_PREFIX}:${key}`;
}

export function getTenantCacheName(name: string): string {
  return `${TENANT_CACHE_PREFIX}-${name}`;
}

export function getTenantPushTag(tag: string): string {
  return `${TENANT_CACHE_PREFIX}-${tag}`;
}
