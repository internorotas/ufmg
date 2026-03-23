import { MapPin, Navigation } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AdminLayout } from './components/admin/AdminLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MenuLateral } from './components/MenuLateral';
import { Modal } from './components/Modal';
import { Button } from './components/ui/Button';
import { RotasProvider, useRotas } from './contexts/RotasContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAnalytics, useAnalyticsAutoTracking } from './hooks/useAnalytics';
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
    linhaSelecionada,
    paradaSelecionada,
    selecionarLinha,
    selecionarParada,
    mapaRef,
  } = useRotas();

  const { trackEvent, trackPageView } = useAnalytics();
  useAnalyticsAutoTracking();
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const offlineToastTimeoutRef = useRef<number | null>(null);

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
    trackPageView();
  }, [trackPageView]);

  useEffect(() => {
    const clearOfflineToastTimeout = () => {
      if (offlineToastTimeoutRef.current !== null) {
        window.clearTimeout(offlineToastTimeoutRef.current);
        offlineToastTimeoutRef.current = null;
      }
    };

    const onOffline = () => {
      setIsOffline(true);
      setShowOfflineToast(true);
      clearOfflineToastTimeout();
      offlineToastTimeoutRef.current = window.setTimeout(() => {
        setShowOfflineToast(false);
      }, 4500);
    };

    const onOnline = () => {
      setIsOffline(false);
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      clearOfflineToastTimeout();
    };
  }, []);

  // Handlers com tracking de analytics
  const handleLinhaSelect = useCallback(
    (linha: Linha) => {
      selecionarLinha(linha);
      trackEvent({
        category: 'engagement',
        action: 'select_line',
        label: linha.nome,
      });
    },
    [selecionarLinha, trackEvent],
  );

  const handleParadaClick = useCallback(
    (parada: Parada) => {
      selecionarParada(parada);
      trackEvent({
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
  if (!todasParadas || todasParadas.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen min-h-dvh w-screen bg-gray-100 text-gray-800">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-2 text-red-600">⚠️ Dados não encontrados</h2>
          <p className="text-gray-600">
            Não foi possível carregar os dados de paradas.
            <br />
            Verifique a integridade dos arquivos em <code>/src/data/paradas.ts</code>.
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
            Verifique a integridade dos arquivos em <code>/src/data/linhas.ts</code>.
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

      {/* Modal de Permissão de Localização */}
      <Modal
        isOpen={mostrarModalPermissao}
        onClose={fecharModalPermissao}
        title={
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-brand-primary" />
            <span>Ativar Localização</span>
          </div>
        }
        size="sm"
      >
        <div className="space-y-4 p-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <MapPin className="h-8 w-8 text-brand-primary" />
            </div>
            <p className="text-text-secondary">
              Para mostrar sua localização no mapa e te ajudar a encontrar a parada mais próxima,
              precisamos acessar seu GPS.
            </p>
          </div>
          {erroLocalizacao && (
            <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
              {erroLocalizacao}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              fullWidth
              disabled={carregandoLocalizacao}
              onClick={() => {
                solicitarPermissaoNavegador();
                trackEvent({
                  category: 'preferences',
                  action: 'grant_location_permission',
                });
              }}
            >
              {carregandoLocalizacao ? 'Obtendo localização...' : 'Permitir Localização'}
            </Button>
            <Button variant="ghost" fullWidth onClick={fecharModalPermissao}>
              Agora não
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Distância (Longe da UFMG) */}
      <Modal
        isOpen={mostrarModalLonge}
        onClose={fecharModalLonge}
        title="Você está longe do campus"
        size="sm"
      >
        <div className="space-y-4 p-4">
          <div className="text-center">
            <p className="text-text-secondary">
              Parece que você está a mais de 4km da UFMG. Deseja voltar a visualizar o campus no
              mapa?
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="primary" fullWidth onClick={handleVoltarParaUFMG}>
              Voltar para a UFMG
            </Button>
            <Button variant="ghost" fullWidth onClick={handleContinuarAqui}>
              Continuar aqui
            </Button>
          </div>
        </div>
      </Modal>

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
          <AppContent />
        </RotasProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
