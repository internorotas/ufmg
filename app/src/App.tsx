import { useState, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import ReactGA from "react-ga4";
import { MenuLateral } from "./components/MenuLateral";
import { MapaRef } from "./components/Mapa";
import { ThemeProvider } from "./contexts/ThemeContext";
import { IoMap } from "react-icons/io5";

// Importa os dados da pasta /data
import linhasData from "./data/linhas";
import paradasData from "./data/paradas";

import { Linha, Parada } from "./types/data.types";

// Lazy loading do Mapa para melhorar a performance inicial
const Mapa = lazy(() => import("./components/Mapa").then(module => ({ default: module.Mapa })));

// Componente de Loading para o Mapa
const MapaLoading = () => (
  <div className="flex h-full w-full items-center justify-center bg-background-secondary animate-pulse">
    <div className="text-center">
      <IoMap size={48} className="mx-auto text-brand-primary opacity-50 mb-4" />
      <p className="text-text-secondary font-medium">Carregando mapa...</p>
    </div>
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
  const [paradaSelecionada, setParadaSelecionada] = useState<Parada | null>(null);
  const mapaRef = useRef<MapaRef>(null);

  // Otimização: useCallback para evitar recriação da função em cada render
  const handleLinhaSelect = useCallback((linha: Linha) => {
    setLinhaSelecionada(linha);

    if (GA_MEASUREMENT_ID) {
      ReactGA.event({
        category: "Mapa",
        action: "Ver Linha",
        label: `${linha.nome} - ${linha.sublinha || "Principal"}`,
      });
    }
  }, []);

  // Otimização: useCallback para evitar recriação da função em cada render
  const handleParadaClick = useCallback((parada: Parada) => {
    setParadaSelecionada(parada);
    mapaRef.current?.centralizarParada(parada);

    if (GA_MEASUREMENT_ID) {
      ReactGA.event({
        category: "Mapa",
        action: "Ver Parada",
        label: parada.nome,
      });
    }
  }, []);

  // Memoização dos dados de paradas para garantir estabilidade referencial
  const todasParadas = useMemo(() => paradasData?.paradas || [], []);

  // Validação Crítica dos dados
  // Verificamos tanto linhasData quanto paradasData para evitar quebrar a aplicação
  if (!todasParadas || todasParadas.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100 text-gray-800">
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
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100 text-gray-800">
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
    <ThemeProvider>
      <div className="relative h-screen w-screen overflow-hidden flex flex-col md:flex-row font-['Poppins',_sans-serif] bg-background">
        {/* Use <main> semantic tag for the map area, or wrapper depending on structure.
            Here, the Menu is <aside> (set in MenuLateral), so the Map is the main content. */}

        <MenuLateral
          linhasData={linhasData}
          todasParadas={todasParadas}
          onLinhaSelect={handleLinhaSelect}
          onParadaClick={handleParadaClick}
          linhaSelecionada={linhaSelecionada}
        />

        <main className="flex-grow h-full w-full relative z-0">
          <Suspense fallback={<MapaLoading />}>
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
  );
}
