import {
  useState,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  useEffect,
} from "react";
import ReactGA from "react-ga4";
import { MenuLateral } from "./components/MenuLateral";
import type { MapaRef } from "./components/Mapa";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAnalytics } from "./hooks/useAnalytics";

// Importa os dados da pasta /data
import linhasData from "./data/linhas";
import paradasData from "./data/paradas";

import { Linha, Parada } from "./types/data.types";

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
 * O componente principal da aplicação. Gerencia o estado da linha e parada selecionadas e renderiza o layout principal com o menu lateral e o mapa.
 *
 * @returns {JSX.Element} O componente principal da aplicação renderizado.
 */
export function App() {
  const [linhaSelecionada, setLinhaSelecionada] = useState<Linha | null>(null);
  const [paradaSelecionada, setParadaSelecionada] = useState<Parada | null>(
    null,
  );
  const mapaRef = useRef<MapaRef>(null);
  const { trackEvent, trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  // Otimização: useCallback para evitar recriação da função em cada render
  const handleLinhaSelect = useCallback(
    (linha: Linha) => {
      setLinhaSelecionada(linha);

      trackEvent({
        category: "Engajamento",
        action: "Selecionar Linha",
        label: linha.nome,
      });
    },
    [trackEvent],
  );

  // Otimização: useCallback para evitar recriação da função em cada render
  const handleParadaClick = useCallback(
    (parada: Parada) => {
      setParadaSelecionada(parada);
      mapaRef.current?.centralizarParada(parada);

      trackEvent({
        category: "Engajamento",
        action: "Selecionar Parada",
        label: parada.nome,
      });
    },
    [trackEvent],
  );

  // Memoização dos dados de paradas para garantir estabilidade referencial
  const todasParadas = useMemo(() => paradasData?.paradas || [], []);

  // Validação Crítica dos dados
  // Verificamos tanto linhasData quanto paradasData para evitar quebrar a aplicação
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
    <ErrorBoundary>
      <ThemeProvider>
        <div className="relative h-screen w-screen overflow-hidden flex flex-col md:flex-row font-['Poppins',_sans-serif] bg-background">
          <MenuLateral
            linhasData={linhasData}
            todasParadas={todasParadas}
            onLinhaSelect={handleLinhaSelect}
            onParadaClick={handleParadaClick}
            linhaSelecionada={linhaSelecionada}
          />
          <main role="main" className="flex-grow h-full w-full">
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
      </ThemeProvider>
    </ErrorBoundary>
  );
}
