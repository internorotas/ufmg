import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnalyticsConsentBanner } from './components/app/AnalyticsConsentBanner';
import { AnalyticsProvider } from './components/app/AnalyticsProvider';
import { BottomNav } from './components/app/BottomNav';
import { DataStatusScreen } from './components/app/DataStatusScreen';
import { MobileTopBar } from './components/app/MobileTopBar';
import { ModalManager } from './components/app/ModalManager';
import { NavRail } from './components/app/NavRail';
import { OfflineToast } from './components/app/OfflineToast';
import { InactivityWarningDialog } from './components/auth/InactivityWarningDialog';
import { BetaBanner } from './components/BetaBanner';
import { CalendarBanner } from './components/CalendarBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InfoBanner } from './components/InfoBanner';
import { LegalModal } from './components/legal/LegalModal';
import { MenuLateral } from './components/MenuLateral';
import { OfflineBanner } from './components/OfflineBanner';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileSheet } from './components/profile/ProfileSheet';
import { GA_MEASUREMENT_ID } from './config/analytics';
import { getCurrentCalendarPeriod, initSpecialPeriodsFromApi } from './config/specialPeriods';
import { LocationProvider, useLocationContext } from './contexts/LocationContext';
import { NotificacaoProvider } from './contexts/NotificacaoContext';
import { RotasProvider, useRotas } from './contexts/RotasContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SESSION_EXPIRED_EVENT } from './features/auth/api/fetchAuthenticatedApi';
import { AuthProvider, useAuthContext } from './features/auth/context/AuthContext';
import { useAuthBootstrap } from './features/auth/hooks/useAuthBootstrap';
import { useConsentGate } from './features/auth/hooks/useConsentGate';
import { GpsLinePickerModal } from './features/gps/components/GpsLinePickerModal';
import { GpsPositionWarningDialog } from './features/gps/components/GpsPositionWarningDialog';
import { GpsSessionProvider, useGpsSession } from './features/gps/context/GpsSessionContext';
import { PlannerSummarySheet } from './features/planner/components/PlannerSummarySheet';
import { usePlannerStore } from './features/planner/store/plannerStore';
import { logout } from './features/profile/api/profileClient';
import { useAnalytics } from './hooks/useAnalytics';
import { readAnalyticsConsent } from './hooks/useAnalyticsConsent';
import { useAppConnectivity } from './hooks/useAppConnectivity';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import { getActiveCategoryLinhas } from './hooks/useLinhasFilter';
import { COORDENADAS_CAMPUS } from './hooks/useLocalizacaoUsuario';
import { useMapAutoCenter } from './hooks/useMapAutoCenter';
import { calcularDistanciaKm } from './lib/utils';
import { ga4Analytics } from './services/analytics';
import { useOnboardingStore } from './stores/onboardingStore';
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

// Rotas carregadas sob demanda — só o Mapa entra no chunk inicial. As demais páginas
// (e suas dependências transitivas) deixam de pesar no bundle de entrada.
const AboutPage = lazy(() =>
  import('./routes/about/AboutPage').then((m) => ({ default: m.AboutPage })),
);
const FakeAdminLoginPage = lazy(() =>
  import('./routes/admin/FakeAdminLoginPage').then((m) => ({ default: m.FakeAdminLoginPage })),
);
const LinhasPage = lazy(() =>
  import('./routes/linhas/LinhasPage').then((m) => ({ default: m.LinhasPage })),
);
const LoginPage = lazy(() =>
  import('./routes/login/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const MorePage = lazy(() =>
  import('./routes/more/MorePage').then((m) => ({ default: m.MorePage })),
);
const ProfilePage = lazy(() =>
  import('./routes/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const ProximosPage = lazy(() =>
  import('./routes/proximos/ProximosPage').then((m) => ({ default: m.ProximosPage })),
);
const RankingPage = lazy(() =>
  import('./routes/ranking/RankingPage').then((m) => ({ default: m.RankingPage })),
);
const ResearchDashboardPage = lazy(() =>
  import('./routes/research/ResearchDashboardPage').then((m) => ({
    default: m.ResearchDashboardPage,
  })),
);

// Fallback genérico de carregamento de página (rotas lazy fora do mapa).
const PageLoading = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Carregando página"
    className="flex h-full w-full items-center justify-center bg-background"
  >
    <div
      aria-hidden="true"
      className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-primary dark:border-brand-accent"
    />
  </div>
);

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
      className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary dark:border-brand-accent"
    />
  </div>
);

// Inicializa GA4 sincronicamente se o usuário já havia concedido consentimento em sessão anterior.
// Deve ocorrer antes do primeiro render para não perder eventos de app_boot.
if (GA_MEASUREMENT_ID && readAnalyticsConsent() === 'accepted') {
  ga4Analytics.grantConsent();
}

const GPS_VALIDATION_THRESHOLD_M = 300;

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
    dataUpdatedAt,
    isOfflineDataFallback,
    linhaSelecionada,
    paradaSelecionada,
    selecionarLinha,
    selecionarParada,
    mapaRef,
  } = useRotas();

  const { trackEvent, trackPageView } = useAnalytics();
  const { authStatus, isAuthenticated } = useAuthContext();
  const { isOffline, showOfflineToast } = useAppConnectivity();
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const { feedbackMessage, executeProtectedAction } = useConsentGate();
  const pendingGpsLinhaRef = useRef<Linha | null>(null);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [isSummarySheetOpen, setIsSummarySheetOpen] = useState(false);
  const [isGpsLinePickerOpen, setIsGpsLinePickerOpen] = useState(false);
  const [isInactivityWarningOpen, setIsInactivityWarningOpen] = useState(false);
  const [infoBannerDismissed, setInfoBannerDismissed] = useState(
    () => sessionStorage.getItem('info-banner-dismissed') === '1',
  );
  const [calendarBannerDismissed, setCalendarBannerDismissed] = useState(
    () => sessionStorage.getItem('calendar-banner-dismissed') === '1',
  );
  const [isCalendarReady, setIsCalendarReady] = useState(false);
  const currentCalendarPeriod = getCurrentCalendarPeriod();
  const [gpsWarning, setGpsWarning] = useState<{
    distanceMeters: number;
    linha: Linha;
    pendingAction: () => void;
  } | null>(null);
  const [authFeedbackMessage, setAuthFeedbackMessage] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void initSpecialPeriodsFromApi().finally(() => {
      if (active) setIsCalendarReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const locationState = location.state as {
      authFeedback?: string;
      openSidebar?: boolean;
    } | null;
    const feedback = locationState?.authFeedback;
    const shouldOpenSidebar = locationState?.openSidebar;

    if (!feedback && !shouldOpenSidebar) return;

    navigate(location.pathname, { replace: true, state: null });

    if (feedback) {
      setAuthFeedbackMessage(feedback);
      const timeoutId = window.setTimeout(() => {
        setAuthFeedbackMessage(null);
      }, 5000);
      return () => window.clearTimeout(timeoutId);
    }

    if (shouldOpenSidebar) {
      const frameId = window.requestAnimationFrame(() => {
        usePlannerStore.getState().openMenuFn?.();
      });
      return () => window.cancelAnimationFrame(frameId);
    }
  }, [location.pathname, location.state, navigate]);

  // Deep link de compartilhamento (?linha=idRota / ?parada=idParada — ver lib/shareLinks.ts).
  // Consome uma única vez, assim que os dados carregarem, e limpa a query da URL.
  useEffect(() => {
    if (todasParadas.length === 0 && linhasData.categoriasDias.length === 0) return;

    const params = new URLSearchParams(location.search);
    const linhaId = params.get('linha');
    const paradaId = params.get('parada');
    if (!linhaId && !paradaId) return;

    if (linhaId) {
      const linha = linhasData.categoriasDias
        .flatMap((categoria) => categoria.linhas)
        .find((l) => l.idRota === linhaId);
      if (linha) selecionarLinha(linha);
    }

    if (paradaId) {
      const parada = todasParadas.find((p) => p.idParada === paradaId);
      if (parada) selecionarParada(parada);
    }

    navigate(location.pathname, { replace: true });
  }, [
    linhasData,
    todasParadas,
    location.search,
    location.pathname,
    navigate,
    selecionarLinha,
    selecionarParada,
  ]);

  // Hook de localização do usuário (via LocationContext — persiste em todas as rotas)
  const {
    localizacao,
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
  } = useLocationContext();

  const [legalModal, setLegalModal] = useState<LegalModalType | null>(() =>
    resolveLegalModalFromPath(window.location.pathname),
  );
  // Sessão GPS via GpsSessionContext — persiste mesmo ao navegar para outras rotas
  const rastreioColaborativo = useGpsSession();
  const {
    isActive: rastreioAtivo,
    start: iniciarRastreioColaborativo,
    stop: encerrarRastreioColaborativo,
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

  const handlePlannerRouteSelected = useCallback(() => {
    setIsSummarySheetOpen(true);
  }, []);

  const handleRegisterMenuOpen = useCallback((fn: () => void) => {
    usePlannerStore.getState().registerOpenMenu(fn);
  }, []);

  const handleOpenMenu = useCallback(() => {
    usePlannerStore.getState().openMenuFn?.();
  }, []);

  // Quando GPS permission chega após seleção de linha, inicia o rastreio automaticamente.
  // Aguarda a primeira leitura de localização para re-verificar a distância antes de iniciar.
  useEffect(() => {
    if (!permissaoConcedida || !pendingGpsLinhaRef.current || rastreioAtivo) return;
    if (!localizacao) return; // espera localizacao chegar antes de validar

    const pendingLine = pendingGpsLinhaRef.current;
    const coords = pendingLine.coordenadasTrajeto;

    if (coords.length > 0) {
      const [userLat, userLng] = localizacao;
      let minKm = Infinity;
      for (const [lat, lng] of coords) {
        const d = calcularDistanciaKm(userLat, userLng, lat, lng);
        if (d < minKm) minKm = d;
      }
      if (minKm * 1000 > GPS_VALIDATION_THRESHOLD_M) {
        pendingGpsLinhaRef.current = null;
        setGpsWarning({
          distanceMeters: Math.round(minKm * 1000),
          linha: pendingLine,
          pendingAction: () => void iniciarRastreioColaborativo(pendingLine),
        });
        return;
      }
    }

    pendingGpsLinhaRef.current = null;
    void iniciarRastreioColaborativo(pendingLine);
  }, [permissaoConcedida, rastreioAtivo, iniciarRastreioColaborativo, localizacao]);

  const startGpsForLinha = useCallback(
    (linha: Linha) => {
      const VALIDATION_THRESHOLD_M = GPS_VALIDATION_THRESHOLD_M;
      const coords = linha.coordenadasTrajeto;

      if (localizacao && coords.length > 0) {
        const [userLat, userLng] = localizacao;
        let minKm = Infinity;
        for (const [lat, lng] of coords) {
          const d = calcularDistanciaKm(userLat, userLng, lat, lng);
          if (d < minKm) minKm = d;
        }
        const distMeters = minKm * 1000;

        if (distMeters > VALIDATION_THRESHOLD_M) {
          const action = () =>
            void executeProtectedAction(async () => {
              if (!permissaoConcedida) {
                pendingGpsLinhaRef.current = linha;
                await iniciarRastreamento();
                return;
              }
              await iniciarRastreioColaborativo(linha);
            });
          setGpsWarning({ distanceMeters: Math.round(distMeters), linha, pendingAction: action });
          return;
        }
      }

      void executeProtectedAction(async () => {
        if (!permissaoConcedida) {
          pendingGpsLinhaRef.current = linha;
          await iniciarRastreamento();
          return;
        }
        await iniciarRastreioColaborativo(linha);
      });
    },
    [
      executeProtectedAction,
      iniciarRastreamento,
      iniciarRastreioColaborativo,
      localizacao,
      permissaoConcedida,
    ],
  );

  const handleAlternarRastreioColaborativo = useCallback(() => {
    if (rastreioAtivo) {
      trackEvent({
        event: 'gps_stop_button_clicked',
        category: 'engagement',
        action: 'gps_stop_button_clicked',
      });
      void encerrarRastreioColaborativo('manual');
      return;
    }

    if (!linhaSelecionada) {
      trackEvent({
        event: 'gps_line_picker_opened',
        category: 'engagement',
        action: 'gps_line_picker_opened',
      });
      setIsGpsLinePickerOpen(true);
      return;
    }

    trackEvent({
      event: 'gps_start_button_clicked',
      category: 'engagement',
      action: 'gps_start_button_clicked',
      label: linhaSelecionada.nome,
    });
    startGpsForLinha(linhaSelecionada);
  }, [encerrarRastreioColaborativo, linhaSelecionada, rastreioAtivo, startGpsForLinha, trackEvent]);

  const handleGpsLinePick = useCallback(
    (linha: Linha) => {
      trackEvent({
        event: 'gps_line_picked',
        category: 'engagement',
        action: 'gps_line_picked',
        label: linha.nome,
        params: { linha_id: linha.idRota },
      });
      selecionarLinha(linha);
      setIsGpsLinePickerOpen(false);
      startGpsForLinha(linha);
    },
    [selecionarLinha, startGpsForLinha, trackEvent],
  );

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

  const handleInactivityTimeout = useCallback(async () => {
    setIsInactivityWarningOpen(false);
    try {
      await logout();
    } catch {
      // ignora erro de rede no logout
    }
    navigate('/login', { state: { authFeedback: 'Sessão encerrada por inatividade.' } });
  }, [navigate]);

  const handleInactivityWarning = useCallback(() => setIsInactivityWarningOpen(true), []);
  const handleInactivityTimeoutCb = useCallback(() => {
    void handleInactivityTimeout();
  }, [handleInactivityTimeout]);

  const { resetTimer: resetInactivityTimer } = useInactivityTimer({
    warningMs: 25 * 60 * 1000,
    timeoutMs: 30 * 60 * 1000,
    onWarning: handleInactivityWarning,
    onTimeout: handleInactivityTimeoutCb,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const handler = () => {
      trackEvent({ event: 'session_expired', category: 'engagement', action: 'session_expired' });
      void handleInactivityTimeout();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, [handleInactivityTimeout, trackEvent]);

  const linhasAtivas = useMemo(
    () => (linhasData && !isOfflineDataFallback ? getActiveCategoryLinhas(linhasData) : []),
    [linhasData, isOfflineDataFallback],
  );

  const handleInfoBannerDismiss = useCallback(() => {
    sessionStorage.setItem('info-banner-dismissed', '1');
    setInfoBannerDismissed(true);
  }, []);

  const handleCalendarBannerDismiss = useCallback(() => {
    sessionStorage.setItem('calendar-banner-dismissed', '1');
    setCalendarBannerDismissed(true);
  }, []);

  // Validação dos dados
  if (isLoadingData || !isCalendarReady) {
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
        title="Dados indisponíveis"
        variant="warning"
        description="Não foi possível carregar as paradas. Verifique sua conexão ou tente novamente mais tarde."
      />
    );
  }

  if (!linhasData?.categoriasDias) {
    return (
      <DataStatusScreen
        title="Dados indisponíveis"
        variant="warning"
        description={
          <>
            Não foi possível carregar as linhas. Verifique sua conexão ou tente novamente mais
            tarde.
          </>
        }
      />
    );
  }

  const handleAuthAction = () => {
    if (isAuthenticated) {
      setIsProfileSheetOpen(true);
      return;
    }
    navigate('/login', { state: { from: location.pathname } });
  };

  return (
    <div className="relative flex flex-1 min-h-0 w-full overflow-hidden bg-background pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <OnboardingModal />
      <a
        href="#main-content"
        className="sr-only absolute left-4 top-4 z-(--z-toast) rounded-lg bg-background px-4 py-2 text-sm font-semibold text-text-primary shadow-lg focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        Pular para o mapa
      </a>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Banners de baixo risco esperam o onboarding ser visto/dispensado — mostrar
            tudo de uma vez assim que o modal fecha é a mesma parede de avisos, só que
            sequenciada em vez de empilhada atrás do backdrop. */}
        {hasSeenOnboarding && (
          <>
            <AnalyticsConsentBanner />
            {/* Conectividade tem prioridade sobre o aviso de beta — mostrar os dois ao
                mesmo tempo é ruído redundante no topo da tela antes do usuário ver o mapa. */}
            {isOffline || isOfflineDataFallback ? (
              <OfflineBanner
                isOffline={isOffline || isOfflineDataFallback}
                updatedAt={isOfflineDataFallback ? dataUpdatedAt : undefined}
              />
            ) : (
              <BetaBanner />
            )}
          </>
        )}
        <MobileTopBar
          authStatus={authStatus}
          isAuthenticated={isAuthenticated}
          onAuthAction={handleAuthAction}
          onOpenMenu={handleOpenMenu}
        />
        <div className="flex min-h-0 flex-1 overflow-hidden md:flex-row">
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
            onPlannerRouteSelected={handlePlannerRouteSelected}
            onRegisterMenuOpen={handleRegisterMenuOpen}
            onAuthAction={handleAuthAction}
          />
          <main
            id="main-content"
            tabIndex={-1}
            aria-label="Mapa das rotas"
            className="relative h-full w-full grow"
          >
            <div
              aria-live="polite"
              className="pointer-events-none absolute left-16 right-3 top-3 z-(--z-banner) flex flex-col gap-2 md:left-auto md:w-full md:max-w-lg"
            >
              {hasSeenOnboarding && currentCalendarPeriod && !calendarBannerDismissed && (
                <div className="pointer-events-auto">
                  <CalendarBanner
                    period={currentCalendarPeriod}
                    onDismiss={handleCalendarBannerDismiss}
                  />
                </div>
              )}
              {hasSeenOnboarding && !currentCalendarPeriod && !infoBannerDismissed && (
                <div className="pointer-events-auto">
                  <InfoBanner onDismiss={handleInfoBannerDismiss} />
                </div>
              )}
              {feedbackMessage ? (
                <div
                  role="alert"
                  aria-label="Aviso de login necessário"
                  className="pointer-events-auto flex items-center gap-3 rounded-xl border border-warning-border bg-warning-bg px-3 py-2.5 text-sm text-warning-text shadow-lg"
                >
                  <span className="flex-1">{feedbackMessage}</span>
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { from: location.pathname } })}
                    className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md bg-warning-text px-3 text-xs font-semibold text-warning-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-text focus-visible:ring-offset-2 focus-visible:ring-offset-warning-bg"
                  >
                    Entrar
                  </button>
                </div>
              ) : null}
            </div>
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
                  linhasAtivas={linhasAtivas}
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
        </div>

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

        <GpsLinePickerModal
          open={isGpsLinePickerOpen}
          onClose={() => setIsGpsLinePickerOpen(false)}
          linhasData={linhasData}
          onSelect={handleGpsLinePick}
        />

        {gpsWarning && (
          <GpsPositionWarningDialog
            open={true}
            linha={gpsWarning.linha}
            distanceMeters={gpsWarning.distanceMeters}
            onConfirm={() => {
              const action = gpsWarning.pendingAction;
              setGpsWarning(null);
              action();
            }}
            onCancel={() => setGpsWarning(null)}
          />
        )}

        <InactivityWarningDialog
          open={isInactivityWarningOpen}
          onContinue={() => {
            setIsInactivityWarningOpen(false);
            resetInactivityTimer();
          }}
        />

        <LegalModal modalType={legalModal} onClose={handleCloseLegalModal} />

        <OfflineToast show={showOfflineToast} />

        <ProfileSheet isOpen={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen} />

        <PlannerSummarySheet
          isOpen={isSummarySheetOpen}
          onClose={() => setIsSummarySheetOpen(false)}
          onBackToResults={() => {
            setIsSummarySheetOpen(false);
            usePlannerStore.getState().openMenuFn?.();
          }}
        />

        {authFeedbackMessage ? (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute bottom-32 left-1/2 z-(--z-toast) -translate-x-1/2 rounded-lg border border-success-border bg-success-bg px-3 py-2 text-xs text-success-text shadow-md"
          >
            {authFeedbackMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AuthenticatedAppShell() {
  useAuthBootstrap();

  return (
    <RotasProvider>
      <AnalyticsProvider>
        <NotificacaoProvider>
          <LocationProvider>
            <GpsSessionProvider>
              <div className="flex h-dvh bg-background text-text-primary">
                <NavRail />
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                  <Suspense fallback={<PageLoading />}>
                    <Routes>
                      <Route path="/" element={<AppContent />} />
                      <Route path="/privacidade" element={<AppContent />} />
                      <Route path="/termos" element={<AppContent />} />
                      <Route path="/sobre" element={<AboutPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/perfil" element={<ProfilePage />} />
                      <Route path="/ranking" element={<RankingPage />} />
                      <Route path="/linhas" element={<LinhasPage />} />
                      <Route path="/proximos" element={<ProximosPage />} />
                      <Route path="/mais" element={<MorePage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </div>
                <BottomNav />
              </div>
            </GpsSessionProvider>
          </LocationProvider>
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
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/admin/*" element={<FakeAdminLoginPage />} />
            <Route path="/pesquisa" element={<ResearchDashboardPage />} />
            <Route path="/*" element={<AppAuthenticatedRoutes />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
