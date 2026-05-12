// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cleanupQueue: Array<() => void> = [];
let RankingPageComponent: typeof import('./RankingPage')['RankingPage'];

const { getPublicRankingMock, getAuthenticatedRankingMock, useAuthContextMock } = vi.hoisted(
  () => ({
    getPublicRankingMock: vi.fn(),
    getAuthenticatedRankingMock: vi.fn(),
    useAuthContextMock: vi.fn(),
  }),
);

vi.mock('@/features/gamification/api/rankingClient', () => ({
  getPublicRanking: getPublicRankingMock,
  getAuthenticatedRanking: getAuthenticatedRankingMock,
}));

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuthContext: useAuthContextMock,
}));

vi.mock('@/contexts/NotificacaoContext', () => ({
  useNotificacaoContext: () => ({ collaborativeFeedback: null }),
}));

vi.mock('@/features/auth/api/authClient', async () => {
  const actual = await vi.importActual('@/features/auth/api/authClient');
  return {
    ...actual,
    startGoogleLoginFlow: vi.fn().mockResolvedValue(undefined),
  };
});

function renderRankingPage(initialPath = '/ranking') {
  const container = document.createElement('div');
  document.body.appendChild(container);
  window.history.pushState({}, '', initialPath);

  const root = createRoot(container);

  act(() => {
    root.render(
      <BrowserRouter>
        <RankingPageComponent />
      </BrowserRouter>,
    );
  });

  cleanupQueue.push(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  return { container };
}

beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
  getPublicRankingMock.mockReset();
  getAuthenticatedRankingMock.mockReset();
  useAuthContextMock.mockReset();
  useAuthContextMock.mockReturnValue({ isAuthenticated: false });
});

beforeEach(async () => {
  ({ RankingPage: RankingPageComponent } = await import('./RankingPage'));
});

afterEach(() => {
  while (cleanupQueue.length > 0) {
    cleanupQueue.pop()?.();
  }
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false);
  document.body.innerHTML = '';
});

describe('RankingPage', () => {
  it('renderiza top 10 publico sem login', async () => {
    getPublicRankingMock.mockResolvedValue({
      period: 'semanal',
      scope: 'geral',
      top: [
        { displayName: 'Pessoa 1', score: 100 },
        { displayName: 'Pessoa 2', score: 95 },
      ],
    });

    const { container } = renderRankingPage();

    await act(async () => {
      await vi.waitFor(() => {
        expect(container.textContent).toContain('Top 10 público');
        expect(getPublicRankingMock).toHaveBeenCalledWith({ period: 'semanal', scope: 'geral' });
      });
    });

    expect(container.textContent).toContain('Entrar para ver completo');
    expect(container.textContent).toContain('não exige login');
  });

  it('renderiza ranking autenticado e destaca posição pessoal', async () => {
    useAuthContextMock.mockReturnValue({ isAuthenticated: true });
    getPublicRankingMock.mockResolvedValue({
      period: 'semanal',
      scope: 'geral',
      top: [
        { displayName: 'Pessoa 1', score: 100 },
        { displayName: 'Pessoa 2', score: 95 },
      ],
    });
    getAuthenticatedRankingMock.mockResolvedValue({
      period: 'semanal',
      scope: 'geral',
      entries: [
        { displayName: 'Pessoa 1', score: 100 },
        { displayName: 'Pessoa 2', score: 95 },
      ],
      currentUser: { displayName: 'Pessoa 1', score: 100, rank: 1 },
    });

    const { container } = renderRankingPage();

    await act(async () => {
      await vi.waitFor(() => {
        expect(container.textContent).toContain('Ranking completo');
        expect(getAuthenticatedRankingMock).toHaveBeenCalledWith({
          period: 'semanal',
          scope: 'geral',
        });
      });
    });

    expect(container.textContent).toContain(
      'Somente display name e pontuação de terceiros continuam visíveis.',
    );
    expect(container.textContent).not.toContain('Entrar para ver completo');
  });
});
