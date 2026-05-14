import { tenantConfig } from '@/tenants/tenantConfig';
import { TENANT_SLUG_HEADER } from '@/tenants/tenantDefinitions';

export function resolveApiEndpoint(pathname: string): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  if (!apiBaseUrl) {
    return pathname;
  }

  return new URL(pathname, apiBaseUrl).toString();
}

export function withTenantHeaders(headers?: HeadersInit): Headers {
  const requestHeaders = new Headers(headers);
  requestHeaders.set(TENANT_SLUG_HEADER, tenantConfig.slug);
  return requestHeaders;
}
