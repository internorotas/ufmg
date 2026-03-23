import { lazy, Suspense, useCallback, useEffect } from 'react';
import { AdminLayout } from './components/admin/AdminLayout';
import { AnalyticsProvider } from './components/app/AnalyticsProvider';
import { ModalManager } from './components/app/ModalManager';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MenuLateral } from './components/MenuLateral';
import { RotasProvider, useRotas } from './contexts/RotasContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAnalytics } from './hooks/useAnalytics';
import { useAppConnectivity } from './hooks/useAppConnectivity';
import { COORDENADAS_UFMG, useLocalizacaoUsuario } from './hooks/useLocalizacaoUsuario';
import { ga4Analytics } from './services/analytics';
import type { Linha, Parada } from './types/data.types';

// Carregamento preguiçoso do Mapa para melhorar a performance inicial
const Mapa = lazy(() => import('./components/Mapa').then((module) => ({ default: module.Mapa })));

// Componente simples de Loading
const LoadingMap = () => (
  <div className="flex items-center justify-center h-full w-full bg-gray-100">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
  </div>
);

// Lê a ID de Medição a partir das variáveis de ambiente
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

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
      trackEvent({
        event: 'select_stop',
        category: 'map_interaction',
        action: 'select_stop',
        label: parada.nome,
      });
    },
    [selecionarParada, trackEvent],
  );

  // Handler para voltar ao campus UFMG
  const handleVoltarParaUFMG = useCallback(() => {
    mapaRef.current?.centralizarCoordenada(COORDENADAS_UFMG, 15);
    fecharModalLonge();
  }, [mapaRef, fecharModalLonge]);

  // Handler para ficar na localização atual do usuário
  const handleContinuarAqui = useCallback(() => {
    if (localizacao) {
      mapaRef.current?.centralizarCoordenada(localizacao, 17);
    }
    fecharModalLonge();
  }, [localizacao, mapaRef, fecharModalLonge]);

  // Validação dos dados
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-screen min-h-dvh w-screen bg-gray-100 text-gray-800">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-2 text-brand-primary">Carregando dados...</h2>
          <p className="text-gray-600">Buscando linhas e paradas em /public/data.</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex items-center justify-center h-screen min-h-dvh w-screen bg-gray-100 text-gray-800">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-2 text-red-600">Erro ao carregar dados</h2>
          <p className="text-gray-600">{dataError}</p>
        </div>
      </div>
    );
  }

  if (!todasParadas || todasParadas.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen min-h-dvh w-screen bg-gray-100 text-gray-800">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-2 text-red-600">⚠️ Dados não encontrados</h2>
          <p className="text-gray-600">
            Não foi possível carregar os dados de paradas.
            <br />
            Verifique a integridade dos arquivos em <code>/public/data/paradas.json</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!linhasData || !linhasData.categoriasDias) {
    return (
      <div className="flex items-center justify-center h-screen min-h-dvh w-screen bg-gray-100 text-gray-800">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-2 text-red-600">⚠️ Erro nos Dados de Linhas</h2>
          <p className="text-gray-600">
            Não foi possível carregar os dados das linhas.
            <br />
            Verifique a integridade dos arquivos em <code>/public/data/linhas.json</code>.
          </p>
        </div>
      </div>
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
        <Suspense fallback={<LoadingMap />}>
          <Mapa
            ref={mapaRef}
            todasParadas={todasParadas}
            linhaSelecionada={linhaSelecionada}
            paradaSelecionada={paradaSelecionada}
            localizacaoUsuario={localizacao}
            headingUsuario={heading}
            permissaoLocalizacao={permissaoConcedida}
            onPedirLocalizacao={iniciarRastreamento}
          />
        </Suspense>
      </main>

      <ModalManager
        erroLocalizacao={erroLocalizacao}
        carregandoLocalizacao={carregandoLocalizacao}
        mostrarModalPermissao={mostrarModalPermissao}
        mostrarModalLonge={mostrarModalLonge}
        onClosePermissao={fecharModalPermissao}
        onCloseLonge={fecharModalLonge}
        onPermitirLocalizacao={() => {
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

      {showOfflineToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-[1200] rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm font-medium text-warning-text shadow-lg"
        >
          Conexao perdida. Mapas podem nao carregar, mas previsoes estaticas continuam funcionando.
        </div>
      )}
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
            <AppContent />
          </AnalyticsProvider>
        </RotasProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
