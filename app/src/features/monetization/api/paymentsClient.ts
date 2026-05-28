import { getAuthHeaders } from '@/features/auth/api/authClient';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';

type PaymentsEndpointPath =
  | '/v1/payments/donations/checkout'
  | '/v1/payments/subscriptions/checkout'
  | '/v1/payments/me';

type DonationStatus = 'pending' | 'paid' | 'cancelled' | 'refunded' | 'disputed';
type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'expired';

export interface CreatedCheckoutResponse {
  id: number;
  provider: 'abacatepay';
  kind: 'donation' | 'subscription';
  status: DonationStatus | SubscriptionStatus;
  checkoutUrl: string;
}

export interface PaymentsOverview {
  provider: 'abacatepay';
  donations: Array<{
    id: number;
    status: DonationStatus;
    valorCents: number;
    checkoutUrl: string;
    receiptUrl: string | null;
    paidAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  subscriptions: Array<{
    id: number;
    status: SubscriptionStatus;
    valorCents: number;
    frequency: 'MONTHLY';
    checkoutUrl: string;
    receiptUrl: string | null;
    startedAt: string | null;
    nextPaymentAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

function resolvePaymentsEndpoint(pathname: PaymentsEndpointPath): string {
  return resolveApiEndpoint(pathname);
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

async function createCheckout(
  pathname: '/v1/payments/donations/checkout' | '/v1/payments/subscriptions/checkout',
): Promise<CreatedCheckoutResponse> {
  const response = await fetch(resolvePaymentsEndpoint(pathname), {
    method: 'POST',
    cache: 'no-store',
    headers: buildAuthenticatedHeaders({
      'Content-Type': 'application/json',
    }),
    body: '{}',
  });

  if (!response.ok) {
    throw new Error(`Falha ao iniciar checkout: HTTP ${response.status}`);
  }

  return response.json() as Promise<CreatedCheckoutResponse>;
}

export function createDonationCheckout(): Promise<CreatedCheckoutResponse> {
  return createCheckout('/v1/payments/donations/checkout');
}

export function createSubscriptionCheckout(): Promise<CreatedCheckoutResponse> {
  return createCheckout('/v1/payments/subscriptions/checkout');
}

export async function getPaymentOverview(): Promise<PaymentsOverview> {
  const response = await fetch(resolvePaymentsEndpoint('/v1/payments/me'), {
    method: 'GET',
    cache: 'no-store',
    headers: buildAuthenticatedHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar histórico financeiro: HTTP ${response.status}`);
  }

  return response.json() as Promise<PaymentsOverview>;
}
