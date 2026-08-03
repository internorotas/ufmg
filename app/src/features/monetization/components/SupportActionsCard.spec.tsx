// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { UserMonetizationSummary } from '@/features/profile/api/profileClient';
import { SupportActionsCard } from './SupportActionsCard';

const fetchMock = vi.fn();

const overview = {
  provider: 'mercadopago' as const,
  recurringSupportActive: true,
  recurringSupport: {
    status: 'active' as const,
    amountCents: 1000,
    nextPaymentAt: '2026-09-01T00:00:00.000Z',
    cancelledAt: null,
  },
  supports: [
    {
      id: 10,
      kind: 'monthly' as const,
      status: 'paid' as const,
      valorCents: 1000,
      receiptUrl: null,
      paidAt: '2026-08-01T00:00:00.000Z',
      cancelledAt: null,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ],
};

describe('SupportActionsCard', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const pathname = new URL(String(input), window.location.origin).pathname;
      if (pathname === '/v1/payments/support/me') {
        return Promise.resolve(
          new Response(JSON.stringify(overview), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      if (pathname === '/v1/payments/support/recurring/checkout') {
        expect(init?.method).toBe('POST');
        return new Promise<Response>(() => undefined);
      }
      if (pathname === '/v1/payments/support/recurring/cancel') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              recurringSupportActive: false,
              status: 'cancelled',
              amountCents: 1000,
              nextPaymentAt: null,
              cancelledAt: '2026-08-02T00:00:00.000Z',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      throw new Error(`endpoint inesperado: ${pathname}`);
    });
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'access-token',
      user: { id: 7, displayName: 'Apoiador', avatarUrl: null, nickname: null },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    container.remove();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    useAuthStore.getState().resetSession();
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false);
  });

  it('mostra apoio pontual e mensal sem superfície Premium', async () => {
    const monetization: UserMonetizationSummary = {
      supporterBadgeUnlocked: true,
      recentTransactions: [],
    };

    await act(async () => {
      root.render(
        <BrowserRouter>
          <SupportActionsCard monetization={monetization} />
        </BrowserRouter>,
      );
    });

    await vi.waitFor(() =>
      expect(container.textContent).toContain('Gerenciamento do apoio mensal'),
    );
    expect(container.textContent).toContain('Apoio pontual');
    expect(container.textContent).toContain('Apoio mensal');
    const renderedText = container.textContent?.replace(/\u00a0/g, ' ');
    expect(renderedText).toContain('R$ 5,00');
    expect(renderedText).toContain('R$ 50,00');
    expect(container.textContent).toContain('Mercado Pago');
    expect(container.textContent).toContain('Histórico de apoios');
    expect(container.textContent).not.toContain('Premium');
    expect(container.textContent).not.toContain('Pix');
  });

  it('exige email e envia centavos ao checkout mensal canônico', async () => {
    await act(async () => {
      root.render(
        <BrowserRouter>
          <SupportActionsCard
            monetization={{ supporterBadgeUnlocked: false, recentTransactions: [] }}
          />
        </BrowserRouter>,
      );
    });

    await vi.waitFor(() => expect(container.textContent).toContain('Apoio pontual'));
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('button[role="tab"][aria-selected="false"]')
        ?.click();
    });

    const monthlyButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Continuar com apoio mensal'),
    );
    expect(monthlyButton).toBeDefined();

    await act(async () => {
      monthlyButton?.click();
    });
    expect(container.textContent).toContain('Informe um email de cobrança válido.');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const email = container.querySelector<HTMLInputElement>('#support-billing-email');
    expect(email).not.toBeNull();
    await act(async () => {
      if (email) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        setter?.call(email, 'cobranca@example.com');
        email.dispatchEvent(new Event('input', { bubbles: true }));
        email.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await act(async () => {
      monthlyButton?.click();
    });
    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/v1/payments/support/recurring/checkout',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ amountCents: 1000, billingEmail: 'cobranca@example.com' }),
        }),
      ),
    );
  });

  it('cancela a assinatura pelo endpoint de gerenciamento', async () => {
    await act(async () => {
      root.render(
        <BrowserRouter>
          <SupportActionsCard
            monetization={{ supporterBadgeUnlocked: false, recentTransactions: [] }}
          />
        </BrowserRouter>,
      );
    });

    await vi.waitFor(() => expect(container.textContent).toContain('Cancelar apoio mensal'));
    const cancelButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Cancelar apoio mensal'),
    );
    await act(async () => {
      cancelButton?.click();
    });
    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/v1/payments/support/recurring/cancel',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(container.textContent).toContain('O apoio mensal foi cancelado.');
  });
});
