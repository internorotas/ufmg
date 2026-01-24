import { lazy, Suspense, useEffect } from "react";
import ReactGA from "react-ga4";
import { MenuLateral } from "./components/MenuLateral";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RotasProvider, useRotas } from "./contexts/RotasContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAnalytics } from "./hooks/useAnalytics";
import type { Linha, Parada } from "./types/data.types";

// Carregamento preguiçoso do Mapa para melhorar a performance inicial
const Mapa = lazy(() =>
  import("./components/Mapa").then((module) => ({ default: module.Mapa })),
);

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
  ReactGA.initialize(GA_MEASUREMENT_ID);
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

  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  // Handlers com tracking de analytics
  const handleLinhaSelect = (linha: Linha) => {
    selecionarLinha(linha);
    trackEvent({
      category: "Engajamento",
      action: "Selecionar Linha",
      label: linha.nome,
    });
  };

  const handleParadaClick = (parada: Parada) => {
    selecionarParada(parada);
    trackEvent({
      category: "Engajamento",
      action: "Selecionar Parada",
      label: parada.nome,
    });
  };

  // Validação dos dados
  if (!todasParadas || todasParadas.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100 text-gray-800">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-2 text-red-600">
            ⚠️ Dados não encontrados
          </h2>
          <p className="text-gray-600">
            Não foi possível carregar os dados de paradas.
            <br />
            Verifique a integridade dos arquivos em{" "}
            <code>/src/data/paradas.ts</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!linhasData || !linhasData.categoriasDias) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100 text-gray-800">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-2 text-red-600">
            ⚠️ Erro nos Dados de Linhas
          </h2>
          <p className="text-gray-600">
            Não foi possível carregar os dados das linhas.
            <br />
            Verifique a integridade dos arquivos em{" "}
            <code>/src/data/linhas.ts</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-background font-['Poppins',sans-serif] md:flex-row">
      <MenuLateral
        linhasData={linhasData}
        todasParadas={todasParadas}
        onLinhaSelect={handleLinhaSelect}
        onParadaClick={handleParadaClick}
        linhaSelecionada={linhaSelecionada}
      />
      <main role="main" className="h-full w-full grow">
        <Suspense fallback={<LoadingMap />}>
          <Mapa
            ref={mapaRef}
            todasParadas={todasParadas}
            linhaSelecionada={linhaSelecionada}
            paradaSelecionada={paradaSelecionada}
          />
        </Suspense>
      </main>
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
