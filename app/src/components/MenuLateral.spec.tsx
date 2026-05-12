// @vitest-environment jsdom

import '@/i18n';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RotasSelectionProvider } from '@/contexts/RotasSelectionContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { setAnalyticsService } from '@/hooks/useAnalytics';
import { ga4Analytics, type IAnalyticsService } from '@/services/analytics';
import { MenuLateral } from './MenuLateral';

const fetchMock = vi.fn();

const analyticsServiceMock: IAnalyticsService = {
  isEnabled: false,
  initialize: vi.fn(),
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
  setUserProperty: vi.fn(),
  trackTiming: vi.fn(),
  trackError: vi.fn(),
};

describe('MenuLateral', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    setAnalyticsService(analyticsServiceMock);

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    setAnalyticsService(ga4Analytics);
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false);
  });

  it('renderiza o slot Parceiro antes da lista de linhas mesmo sem auth', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          slug: 'cafeteria-centro',
          nome: 'Cafeteria Centro',
          descricaoCurta: 'Apoio institucional ao projeto.',
          logoUrl: 'https://cdn.interno.test/logo.png',
          urlDestino: 'https://parceiro.test',
          badgeSlug: 'patrocinador-institucional',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await act(async () => {
      root.render(
        <BrowserRouter>
          <ThemeProvider>
            <RotasSelectionProvider>
              <MenuLateral
                linhasData={{
                  categoriasDias: [
                    {
                      id: 1,
                      categoriaDia: 'diasUteis',
                      displayName: 'Dias úteis',
                      linhas: [
                        {
                          idRota: 'DU10',
                          linha: 10,
                          nome: 'Linha DU10',
                          tipo: 'circular',
                          sublinha: null,
                          categoriaDia: 'diasUteis',
                          corHex: '#2563eb',
                          descricao: 'Linha de teste',
                          horarios: ['08:00', '09:00'],
                          itinerarioParadasIds: [],
                          coordenadasTrajeto: [],
                        },
                      ],
                    },
                  ],
                }}
                todasParadas={[]}
                onLinhaSelect={vi.fn()}
                onParadaClick={vi.fn()}
                linhaSelecionada={null}
                isOffline={false}
                authStatus="anonymous"
                isAuthenticated={false}
                onAuthAction={vi.fn()}
                userScore={null}
              />
            </RotasSelectionProvider>
          </ThemeProvider>
        </BrowserRouter>,
      );
    });

    await act(async () => {
      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/v1/partners/active',
          expect.objectContaining({ cache: 'no-store', method: 'GET' }),
        );
        expect(container.querySelector('[data-slot="partner-spotlight"]')).not.toBeNull();
      });
    });

    const partnerSpotlight = container.querySelector('[data-slot="partner-spotlight"]');
    const lineButton = container.querySelector('[data-slot="select-line"]');

    expect(container.textContent).toContain('Parceiro');
    expect(container.textContent).toContain('Cafeteria Centro');
    expect(container.textContent).toContain('Entrar');
    expect(partnerSpotlight).not.toBeNull();
    expect(lineButton).not.toBeNull();

    if (!partnerSpotlight || !lineButton) {
      throw new Error('Parceiro ou linha não renderizados para validação de ordem.');
    }

    expect(
      Boolean(
        partnerSpotlight.compareDocumentPosition(lineButton) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
  });
});
