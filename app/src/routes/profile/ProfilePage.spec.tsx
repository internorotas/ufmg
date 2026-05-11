// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ProfilePage } from './ProfilePage';

const fetchMock = vi.fn();
const cleanupQueue: Array<() => void> = [];

function renderProfilePage(initialPath = '/perfil') {
  const container = document.createElement('div');
  document.body.appendChild(container);
  window.history.pushState({}, '', initialPath);

  const root = createRoot(container);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ProfilePage />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>,
    );
  });

  const cleanup = () => {
    act(() => {
      root.unmount();
    });
    queryClient.clear();
    container.remove();
  };

  cleanupQueue.push(cleanup);

  return {
    container,
    cleanup,
  };
}

beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', fetchMock);
  useAuthStore.getState().resetSession();
  window.__internoAuthToken = null;
});

afterEach(() => {
  while (cleanupQueue.length > 0) {
    const cleanup = cleanupQueue.pop();
    if (cleanup) {
      cleanup();
    }
  }

  fetchMock.mockReset();
  vi.unstubAllGlobals();
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false);
  document.body.innerHTML = '';
  useAuthStore.getState().resetSession();
  window.__internoAuthToken = null;
});

describe('ProfilePage', () => {
  it('renderiza redirect quando usuário não está autenticado', () => {
    const { container } = renderProfilePage();

    expect(container.textContent).toBe('');
  });

  it('mantem tela de validacao enquanto authStatus estiver booting', () => {
    useAuthStore.setState({
      accessToken: null,
      authStatus: 'booting',
      isAuthenticated: false,
      user: null,
    });

    const { container } = renderProfilePage();

    expect(container.textContent).toContain('Validando sessão');
  });

  it('renderiza perfil autenticado com dados vindos da API', async () => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'access-token',
      user: {
        id: 1,
        displayName: 'User One',
        avatarUrl: null,
        nickname: null,
      },
    });
    window.__internoAuthToken = 'access-token';

    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            id: 1,
            displayName: 'User One',
            avatarUrl: null,
            nickname: 'u1',
            profilePublic: true,
            mapMarkerVisible: true,
            rankingDetail: 'geral',
            notificationProfile: 'normal',
            consentGps: false,
            consentResearch: false,
            consentGpsAt: null,
            consentResearchAt: null,
            lastSeenAt: '2026-05-11T01:00:00.000Z',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    const { container } = renderProfilePage();

    await act(async () => {
      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/v1/auth/profile',
          expect.objectContaining({
            method: 'GET',
          }),
        );

        expect(container.textContent).toContain('User One');
      });
    });

    expect(container.textContent).toContain('@u1');
    expect(container.textContent).toContain('Ranking geral');
    expect(container.textContent).toContain('Normal');
    expect(container.textContent).toContain('Solicitar exclusão de conta');
  });
});
