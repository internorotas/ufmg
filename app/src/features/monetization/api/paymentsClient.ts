import { getAuthHeaders } from '@/features/auth/api/authClient';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';

type SupportStatus = 'pending' | 'paid' | 'cancelled' | 'refunded' | 'disputed';
type RecurringSupportStatus = 'pending' | 'active' | 'cancelled' | 'expired';

export interface CreatedCheckoutResponse {
  id: number;
  provider: 'mercadopago';
  kind: 'support' | 'recurring_support' | 'donation' | 'subscription';
  status: SupportStatus | RecurringSupportStatus;
  checkoutUrl: string;
}

export interface SupportPaymentHistoryItem {
  id: number;
  kind: 'point' | 'monthly';
  status: SupportStatus;
  valorCents: number;
  receiptUrl: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentsOverview {
  provider: 'mercadopago';
  recurringSupportActive: boolean;
  recurringSupport: {
    status: RecurringSupportStatus;
    amountCents: number;
    nextPaymentAt: string | null;
    cancelledAt: string | null;
  } | null;
  supports: SupportPaymentHistoryItem[];
}

function buildAuthenticatedHeaders(extraHeaders?: HeadersInit): HeadersInit {
  const authHeaders = getAuthHeaders();
  if (!authHeaders) {
    throw new Error('Sessão autenticada ausente');
  }

  return withTenantHeaders({
    ...(authHeaders as Record<string, string>),
    ...(extraHeaders as Record<string, string> | undefined),
  });
}

function safePaymentError(status: number): Error {
  if (status === 400) {
    return new Error('Confira o valor e os dados informados para o apoio.');
  }
  if (status === 401 || status === 403) {
    return new Error('Entre novamente para gerenciar seus apoios.');
  }
  if (status === 409) {
    return new Error('Esse identificador já foi usado com outros dados. Tente novamente.');
  }
  if (status === 410 || status === 503) {
    return new Error('Este tipo de apoio está temporariamente indisponível.');
  }
  return new Error('Não foi possível concluir a operação de apoio. Tente novamente.');
}

async function postJson<T>(pathname: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(resolveApiEndpoint(pathname), {
      method: 'POST',
      cache: 'no-store',
      headers: buildAuthenticatedHeaders(
        body === undefined ? undefined : { 'Content-Type': 'application/json' },
      ),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error('Falha de rede ao processar o apoio.');
  }

  if (!response.ok) {
    throw safePaymentError(response.status);
  }

  return response.json() as Promise<T>;
}

async function getJson<T>(pathname: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(resolveApiEndpoint(pathname), {
      method: 'GET',
      cache: 'no-store',
      headers: buildAuthenticatedHeaders(),
    });
  } catch {
    throw new Error('Falha de rede ao carregar os apoios.');
  }

  if (!response.ok) {
    throw safePaymentError(response.status);
  }

  return response.json() as Promise<T>;
}

export function createSupportCheckout(
  amountCents: number,
  idempotencyKey: string,
): Promise<CreatedCheckoutResponse> {
  return postJson('/v1/payments/support/checkout', { amountCents, idempotencyKey });
}

export function createRecurringSupportCheckout(
  amountCents: number,
  billingEmail: string,
  idempotencyKey: string,
): Promise<CreatedCheckoutResponse> {
  return postJson('/v1/payments/support/recurring/checkout', {
    amountCents,
    billingEmail,
    idempotencyKey,
  });
}

export function getSupportOverview(): Promise<PaymentsOverview> {
  return getJson('/v1/payments/support/me');
}

export function cancelRecurringSupport(): Promise<{
  recurringSupportActive: boolean;
  status: RecurringSupportStatus | null;
  amountCents: number | null;
  nextPaymentAt: string | null;
  cancelledAt: string | null;
}> {
  return postJson('/v1/payments/support/recurring/cancel');
}

/** Compatibilidade para consumidores internos que ainda usam o nome antigo. */
export function getPaymentOverview(): Promise<PaymentsOverview> {
  return getSupportOverview();
}
