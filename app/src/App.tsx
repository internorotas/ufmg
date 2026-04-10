import { lazy, Suspense, useCallback, useEffect } from 'react';
import { AdminLayout } from './components/admin/AdminLayout';
import { AnalyticsProvider } from './components/app/AnalyticsProvider';
import { DataStatusScreen } from './components/app/DataStatusScreen';
import { ModalManager } from './components/app/ModalManager';
import { OfflineToast } from './components/app/OfflineToast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MenuLateral } from './components/MenuLateral';
import { GA_MEASUREMENT_ID } from './config/analytics';
import { NotificacaoProvider } from './contexts/NotificacaoContext';
import { RotasProvider, useRotas } from './contexts/RotasContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAnalytics } from './hooks/useAnalytics';
import { useAppConnectivity } from './hooks/useAppConnectivity';
import { COORDENADAS_UFMG, useLocalizacaoUsuario } from './hooks/useLocalizacaoUsuario';
import { useMapAutoCenter } from './hooks/useMapAutoCenter';
import { ga4Analytics } from './services/analytics';
import type { Linha, Parada } from './types/data.types';

// Carregamento preguiçoso do Mapa para melhorar a performance inicial
const Mapa = lazy(() => import('./components/Mapa').then((module) => ({ default: module.Mapa })));

// Componente simples de Loading
const LoadingMap = () => (
  <div className="flex items-center justify-center h-full w-full bg-background-secondary">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
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
  const {
    linhasData,
    todasParadas,
    isLoadingData,
    dataError,
    linhaSelecionada,
    paradaSelecionada,
    selecionarLinha,
    selecionarParada,
    mapaRef,
  } = useRotas();

  const { trackEvent, trackPageView } = useAnalytics();
  const { isOffline, showOfflineToast } = useAppConnectivity();

  // Hook de localização do usuário
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
  } = useLocalizacaoUsuario();
  const { solicitarAutoCenter, consumirAutoCenter } = useMapAutoCenter({
    mapaRef,
    localizacao,
    carregandoLocalizacao,
    mostrarModalLonge,
  });

  useEffect(() => {
    trackPageView('/home');
  }, [trackPageView]);

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

  // Handler para voltar ao campus UFMG
  const handleVoltarParaUFMG = useCallback(() => {
    consumirAutoCenter();
    mapaRef.current?.centralizarCoordenada(COORDENADAS_UFMG, 15);
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
        description="Buscando linhas e paradas em /public/data."
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
      <MenuLateral
        linhasData={linhasData}
        todasParadas={todasParadas}
        onLinhaSelect={handleLinhaSelect}
        onParadaClick={handleParadaClick}
        linhaSelecionada={linhaSelecionada}
        isOffline={isOffline}
      />
      <main className="h-full w-full grow">
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
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
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
              onPedirLocalizacao={() => {
                solicitarAutoCenter();
                iniciarRastreamento();
              }}
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
        onVoltarUFMG={handleVoltarParaUFMG}
        onContinuarAqui={handleContinuarAqui}
      />

      <OfflineToast show={showOfflineToast} />
    </div>
  );
}

/**
 * O componente principal da aplicação.
 * Configura os Providers e renderiza o conteúdo.
 *
 * @returns {JSX.Element} O componente principal da aplicação renderizado.
 */
export function App() {
  if (import.meta.env.DEV && window.location.search.includes('admin=true')) {
    return (
      <ThemeProvider>
        <AdminLayout />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <RotasProvider>
          <AnalyticsProvider>
            <NotificacaoProvider>
              <AppContent />
            </NotificacaoProvider>
          </AnalyticsProvider>
        </RotasProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
