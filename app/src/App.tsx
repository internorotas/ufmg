import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnalyticsProvider } from './components/app/AnalyticsProvider';
import { DataSourceBanner } from './components/app/DataSourceBanner';
import { DataStatusScreen } from './components/app/DataStatusScreen';
import { ModalManager } from './components/app/ModalManager';
import { OfflineToast } from './components/app/OfflineToast';
import { LgpdConsentDialog } from './components/auth/LgpdConsentDialog';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LegalModal } from './components/legal/LegalModal';
import { MenuLateral } from './components/MenuLateral';
import { OfflineBanner } from './components/OfflineBanner';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileSheet } from './components/profile/ProfileSheet';
import { GA_MEASUREMENT_ID } from './config/analytics';
import { NotificacaoProvider } from './contexts/NotificacaoContext';
import { RotasProvider, useRotas } from './contexts/RotasContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { startGoogleLoginFlow } from './features/auth/api/authClient';
import { AuthProvider, useAuthContext } from './features/auth/context/AuthContext';
import { useAuthBootstrap } from './features/auth/hooks/useAuthBootstrap';
import { useConsentGate } from './features/auth/hooks/useConsentGate';
import { useGpsTrackingSession } from './features/gps/hooks/useGpsTrackingSession';
import { useAnalytics } from './hooks/useAnalytics';
import { useAppConnectivity } from './hooks/useAppConnectivity';
import { COORDENADAS_CAMPUS, useLocalizacaoUsuario } from './hooks/useLocalizacaoUsuario';
import { useMapAutoCenter } from './hooks/useMapAutoCenter';
import { AboutPage } from './routes/about/AboutPage';
import { FakeAdminLoginPage } from './routes/admin/FakeAdminLoginPage';
import { ProfilePage } from './routes/profile/ProfilePage';
import { RankingPage } from './routes/ranking/RankingPage';
import { ResearchDashboardPage } from './routes/research/ResearchDashboardPage';
import { ga4Analytics } from './services/analytics';
import type { Linha, Parada } from './types/data.types';
import type { LegalModalType } from './types/legal.types';

const APP_BASE_URL = import.meta.env.BASE_URL || '/';

function stripAppBasePath(pathname: string): string {
  const normalizedBase = APP_BASE_URL.startsWith('/') ? APP_BASE_URL : `/${APP_BASE_URL}`;
  const trimmedBase =
    normalizedBase.endsWith('/') && normalizedBase !== '/'
      ? normalizedBase.slice(0, normalizedBase.length - 1)
      : normalizedBase;

  let cleanPathname = pathname;
  if (trimmedBase !== '/' && cleanPathname.startsWith(trimmedBase)) {
    cleanPathname = cleanPathname.slice(trimmedBase.length) || '/';
  }

  if (!cleanPathname.startsWith('/')) {
    cleanPathname = `/${cleanPathname}`;
  }

  if (cleanPathname.length > 1 && cleanPathname.endsWith('/')) {
    cleanPathname = cleanPathname.slice(0, cleanPathname.length - 1);
  }

  return cleanPathname;
}

function resolveLegalModalFromPath(pathname: string): LegalModalType | null {
  const currentPath = stripAppBasePath(pathname);

  if (currentPath === '/privacidade') {
    return 'privacidade';
  }

  if (currentPath === '/termos') {
    return 'termos';
  }

  return null;
}

// Carregamento preguiçoso do Mapa para melhorar a performance inicial
const Mapa = lazy(() => import('./components/Mapa').then((module) => ({ default: module.Mapa })));

// Componente simples de Loading
const LoadingMap = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Carregando mapa"
    className="flex items-center justify-center h-full w-full bg-background-secondary"
  >
    <div
      aria-hidden="true"
      className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"
    />
  </div>
);

// Lê a ID de Medição a partir das variáveis de ambiente (via src/config/analytics.ts)
// Inicializa o Google Analytics APENAS se a ID existir
if (GA_MEASUREMENT_ID) {
  ga4Analytics.initialize();
}

/**
 * Componente interno que consome o contexto de rotas.
 * Separado do App principal para que o useRotas funcione dentro do Provider.
 */
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    linhasData,
    todasParadas,
    isLoadingData,
    dataError,
    dataSource,
    isOfflineDataFallback,
    linhaSelecionada,
    paradaSelecionada,
    selecionarLinha,
    selecionarParada,
    mapaRef,
  } = useRotas();

  const { trackEvent, trackPageView } = useAnalytics();
  const { authStatus, isAuthenticated, user } = useAuthContext();
  const { isOffline, showOfflineToast } = useAppConnectivity();
  const {
    dialogOpen,
    feedbackMessage,
    executeProtectedAction,
    acceptAndContinue,
    refuseConsent,
    closeDialog,
  } = useConsentGate();
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [authFeedbackMessage, setAuthFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const locationState = location.state as { authFeedback?: string } | null;
    const feedback = locationState?.authFeedback;
    if (!feedback) {
      return;
    }

    setAuthFeedbackMessage(feedback);
    navigate(location.pathname, { replace: true, state: null });

    const timeoutId = window.setTimeout(() => {
      setAuthFeedbackMessage(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location.pathname, location.state, navigate]);

  // Hook de localização do usuário
  const {
    localizacao,
    ultimaLeitura,
    heading,
    permissaoConcedida,
    carregando: carregandoLocalizacao,
    erro: erroLocalizacao,
    mostrarModalPermissao,
    mostrarModalLonge,
    fecharModalPermissao,
    fecharModalLonge,
    iniciarRastreamento,
    solicitarPermissaoNavegador,
  } = useLocalizacaoUsuario();

  const [legalModal, setLegalModal] = useState<LegalModalType | null>(() =>
    resolveLegalModalFromPath(window.location.pathname),
  );
  const rastreioColaborativo = useGpsTrackingSession({
    enabled: isAuthenticated,
    selectedLine: linhaSelecionada,
    userId: user?.id ?? null,
  });
  const {
    isActive: rastreioAtivo,
    start: iniciarRastreioColaborativo,
    stop: encerrarRastreioColaborativo,
    ingestSnapshot,
  } = rastreioColaborativo;
  const { solicitarAutoCenter, consumirAutoCenter } = useMapAutoCenter({
    mapaRef,
    localizacao,
    carregandoLocalizacao,
    mostrarModalLonge,
  });

  useEffect(() => {
    const currentPath = stripAppBasePath(location.pathname);
    trackPageView(currentPath === '/' ? '/home' : currentPath);
  }, [location.pathname, trackPageView]);

  useEffect(() => {
    setLegalModal(resolveLegalModalFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (!ultimaLeitura || !rastreioAtivo) {
      return;
    }

    void ingestSnapshot({
      ...ultimaLeitura,
      heading: ultimaLeitura.heading ?? heading,
    });
  }, [heading, ingestSnapshot, rastreioAtivo, ultimaLeitura]);

  // Handlers com tracking de analytics
  const handleLinhaSelect = useCallback(
    (linha: Linha) => {
      selecionarLinha(linha);
      trackEvent({
        event: 'select_line',
        category: 'engagement',
        action: 'select_line',
        label: linha.nome,
      });
      trackPageView(`/line/${linha.idRota}`);
    },
    [selecionarLinha, trackEvent, trackPageView],
  );

  const handleParadaClick = useCallback(
    (parada: Parada) => {
      selecionarParada(parada);
      mapaRef.current?.centralizarParada(parada);
      trackEvent({
        event: 'select_stop',
        category: 'map_interaction',
        action: 'select_stop',
        label: parada.nome,
      });
    },
    [selecionarParada, mapaRef, trackEvent],
  );

  const handleOpenLegalModal = useCallback((modalType: LegalModalType) => {
    setLegalModal(modalType);
  }, []);

  const handleCloseLegalModal = useCallback(() => {
    setLegalModal(null);
    const currentPath = stripAppBasePath(location.pathname);
    if (currentPath === '/privacidade' || currentPath === '/termos') {
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Handler para recentralizar no campus do tenant atual.
  const handlePedirLocalizacao = useCallback(() => {
    solicitarAutoCenter();
    iniciarRastreamento();
  }, [solicitarAutoCenter, iniciarRastreamento]);

  const handleAlternarRastreioColaborativo = useCallback(() => {
    if (rastreioAtivo) {
      void encerrarRastreioColaborativo('manual');
      return;
    }

    void executeProtectedAction(async () => {
      if (!permissaoConcedida) {
        await iniciarRastreamento();
        return;
      }

      await iniciarRastreioColaborativo();
    });
  }, [
    encerrarRastreioColaborativo,
    executeProtectedAction,
    iniciarRastreamento,
    iniciarRastreioColaborativo,
    permissaoConcedida,
    rastreioAtivo,
  ]);

  // Handler para voltar ao campus principal.
  const handleVoltarAoCampus = useCallback(() => {
    consumirAutoCenter();
    mapaRef.current?.centralizarCoordenada(COORDENADAS_CAMPUS, 15);
    fecharModalLonge();
  }, [consumirAutoCenter, mapaRef, fecharModalLonge]);

  // Handler para ficar na localização atual do usuário
  const handleContinuarAqui = useCallback(() => {
    if (localizacao) {
      mapaRef.current?.centralizarCoordenada(localizacao, 17);
      consumirAutoCenter();
    }
    fecharModalLonge();
  }, [localizacao, consumirAutoCenter, mapaRef, fecharModalLonge]);

  // Validação dos dados
  if (isLoadingData) {
    return (
      <DataStatusScreen
        title="Carregando dados..."
        description="Buscando linhas e paradas na API e no cache local."
      />
    );
  }

  if (dataError) {
    return (
      <DataStatusScreen title="Erro ao carregar dados" description={dataError} variant="warning" />
    );
  }

  if (!todasParadas || todasParadas.length === 0) {
    return (
      <DataStatusScreen
        title="⚠️ Dados não encontrados"
        variant="warning"
        description={
          <>
            Não foi possível carregar os dados de paradas.
            <br />
            Verifique a integridade dos arquivos em <code>/public/data/paradas.json</code>.
          </>
        }
      />
    );
  }

  if (!linhasData?.categoriasDias) {
    return (
      <DataStatusScreen
        title="⚠️ Erro nos Dados de Linhas"
        variant="warning"
        description={
          <>
            Não foi possível carregar os dados das linhas.
            <br />
            Verifique a integridade dos arquivos em <code>/public/data/linhas.json</code>.
          </>
        }
      />
    );
  }

  return (
    <div className="relative flex h-screen min-h-dvh w-full flex-col overflow-hidden bg-background font-['Poppins',sans-serif] md:flex-row">
      <OnboardingModal onOpenLegalModal={handleOpenLegalModal} />
      <OfflineBanner isOffline={isOffline || isOfflineDataFallback} />
      <a
        href="#main-content"
        className="sr-only absolute left-4 top-4 z-[1400] rounded-lg bg-background px-4 py-2 text-sm font-semibold text-text-primary shadow-lg focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        Pular para o mapa
      </a>
      <MenuLateral
        linhasData={linhasData}
        todasParadas={todasParadas}
        onLinhaSelect={handleLinhaSelect}
        onParadaClick={handleParadaClick}
        onOpenLegalModal={handleOpenLegalModal}
        linhaSelecionada={linhaSelecionada}
        isOffline={isOffline || isOfflineDataFallback}
        authStatus={authStatus}
        isAuthenticated={isAuthenticated}
        userScore={null}
        onAuthAction={() => {
          if (isAuthenticated) {
            setIsProfileSheetOpen(true);
            return;
          }

          void startGoogleLoginFlow().catch(() => {
            setAuthFeedbackMessage('Falha ao iniciar login com Google. Tente novamente.');
          });
        }}
      />
      <DataSourceBanner isVisible={isOfflineDataFallback} source={dataSource} />
      <main
        id="main-content"
        tabIndex={-1}
        aria-label="Mapa das rotas"
        className="h-full w-full grow"
      >
        <ErrorBoundary
          fallback={
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background-secondary p-8 text-center">
              <p className="text-lg font-semibold text-text-primary">
                Não foi possível carregar o mapa
              </p>
              <p className="text-sm text-text-secondary">
                Recarregue a página para tentar novamente.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-text-inverse"
              >
                Recarregar
              </button>
            </div>
          }
        >
          <Suspense fallback={<LoadingMap />}>
            <Mapa
              ref={mapaRef}
              todasParadas={todasParadas}
              linhaSelecionada={linhaSelecionada}
              paradaSelecionada={paradaSelecionada}
              localizacaoUsuario={localizacao}
              headingUsuario={heading}
              permissaoLocalizacao={permissaoConcedida}
              carregandoLocalizacao={carregandoLocalizacao}
              onPedirLocalizacao={handlePedirLocalizacao}
              rastreioColaborativo={rastreioColaborativo}
              onAlternarRastreioColaborativo={handleAlternarRastreioColaborativo}
            />
          </Suspense>
        </ErrorBoundary>
      </main>

      <ModalManager
        erroLocalizacao={erroLocalizacao}
        carregandoLocalizacao={carregandoLocalizacao}
        mostrarModalPermissao={mostrarModalPermissao}
        mostrarModalLonge={mostrarModalLonge}
        onClosePermissao={fecharModalPermissao}
        onCloseLonge={fecharModalLonge}
        onPermitirLocalizacao={() => {
          solicitarAutoCenter();
          solicitarPermissaoNavegador();
          trackEvent({
            event: 'location_permission_granted',
            category: 'preferences',
            action: 'location_permission_granted',
          });
        }}
        onVoltarAoCampus={handleVoltarAoCampus}
        onContinuarAqui={handleContinuarAqui}
      />

      <LegalModal modalType={legalModal} onClose={handleCloseLegalModal} />

      <OfflineToast show={showOfflineToast} />

      <LgpdConsentDialog
        isOpen={dialogOpen}
        onClose={closeDialog}
        onAccept={acceptAndContinue}
        onRefuse={refuseConsent}
      />

      <ProfileSheet isOpen={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen} />

      {authFeedbackMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute bottom-32 left-1/2 z-[1400] -translate-x-1/2 rounded-lg border border-success-border bg-success-bg px-3 py-2 text-xs text-success-text shadow-md"
        >
          {authFeedbackMessage}
        </div>
      ) : null}

      {feedbackMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute bottom-20 left-1/2 z-[1400] -translate-x-1/2 rounded-lg bg-warning-bg px-3 py-2 text-xs text-warning-text shadow-md"
        >
          {feedbackMessage}
        </div>
      ) : null}
    </div>
  );
}

function AuthenticatedAppShell() {
  useAuthBootstrap();

  return (
    <RotasProvider>
      <AnalyticsProvider>
        <NotificacaoProvider>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/privacidade" element={<AppContent />} />
            <Route path="/termos" element={<AppContent />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificacaoProvider>
      </AnalyticsProvider>
    </RotasProvider>
  );
}

function AppAuthenticatedRoutes() {
  return (
    <AuthProvider>
      <AuthenticatedAppShell />
    </AuthProvider>
  );
}

/**
 * O componente principal da aplicação.
 * Configura os Providers e renderiza o conteúdo.
 *
 * @returns {JSX.Element} O componente principal da aplicação renderizado.
 */
export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Routes>
          <Route path="/admin/*" element={<FakeAdminLoginPage />} />
          <Route path="/pesquisa" element={<ResearchDashboardPage />} />
          <Route path="/*" element={<AppAuthenticatedRoutes />} />
        </Routes>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
