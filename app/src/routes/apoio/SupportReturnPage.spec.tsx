/* @vitest-environment jsdom */

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGpsSession } from '@/features/gps/context/GpsSessionContext';
import {
  getSupportOverview,
  type PaymentsOverview,
} from '@/features/monetization/api/paymentsClient';
import { resolveReturnState, SupportReturnPage } from './SupportReturnPage';

vi.mock('@/features/monetization/api/paymentsClient', () => ({
  getSupportOverview: vi.fn(),
}));

vi.mock('@/features/gps/context/GpsSessionContext', () => ({
  useGpsSession: vi.fn(),
}));

function makeOverview(overrides: Partial<PaymentsOverview> = {}): PaymentsOverview {
  return {
    provider: 'mercadopago',
    recurringSupportActive: false,
    recurringSupport: null,
    supports: [],
    ...overrides,
  };
}

describe('SupportReturnPage', () => {
  beforeEach(() => {
    vi.mocked(useGpsSession).mockReturnValue({ isActive: false } as ReturnType<
      typeof useGpsSession
    >);
    vi.mocked(getSupportOverview).mockResolvedValue(makeOverview());
  });

  it('usa o apoio mais recente e distingue cancelamento de pendência', () => {
    const overview = makeOverview({
      supports: [
        {
          id: 1,
          kind: 'point',
          status: 'paid',
          valorCents: 1000,
          receiptUrl: null,
          paidAt: '2026-01-01T00:00:00.000Z',
          cancelledAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          kind: 'point',
          status: 'cancelled',
          valorCents: 1000,
          receiptUrl: null,
          paidAt: null,
          cancelledAt: '2026-01-02T00:00:00.000Z',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    });

    expect(resolveReturnState(overview)).toBe('cancelled');
  });

  it('confirma pelo estado do servidor e avisa se o GPS continua ativo', async () => {
    vi.mocked(useGpsSession).mockReturnValue({ isActive: true } as ReturnType<
      typeof useGpsSession
    >);
    vi.mocked(getSupportOverview).mockResolvedValue(
      makeOverview({
        supports: [
          {
            id: 1,
            kind: 'point',
            status: 'paid',
            valorCents: 1000,
            receiptUrl: null,
            paidAt: '2026-01-01T00:00:00.000Z',
            cancelledAt: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    );

    render(
      <MemoryRouter>
        <SupportReturnPage />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByRole('heading').textContent).toContain('Apoio confirmado'),
    );
    expect(screen.getByText(/rastreio GPS continua ativo/i)).toBeTruthy();
  });
});
