import { resolveApiEndpoint, withTenantHeaders } from './apiClient';

let _adminToken = '';
let _adminEmail = '';

export function setAdminCredentials(email: string, token: string): void {
  _adminEmail = email;
  _adminToken = token;
}

export function clearAdminCredentials(): void {
  _adminEmail = '';
  _adminToken = '';
}

export function getAdminHeaders(): Record<string, string> {
  if (!_adminToken) return {};
  return { 'x-admin-email': _adminEmail, 'x-admin-service-token': _adminToken };
}

export async function verifyAdminCredentials(email: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(resolveApiEndpoint('/v1/admin/telemetria'), {
      headers: withTenantHeaders({
        'x-admin-email': email,
        'x-admin-service-token': token,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
