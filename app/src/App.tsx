import { useState, useRef } from "react";
import ReactGA from "react-ga4";
import { MenuLateral } from "./components/MenuLateral";
import { Mapa, MapaRef } from "./components/Mapa";
import { ThemeProvider } from "./contexts/ThemeContext";

// Importa os dados da pasta /data
import linhasData from "./data/linhas";
import paradasData from "./data/paradas";

import { Linha, Parada } from "./types/data.types";

// Lê a ID de Medição a partir das variáveis de ambiente
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Inicializa o Google Analytics APENAS se a ID existir
if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}

export function App() {
  const [linhaSelecionada, setLinhaSelecionada] = useState<Linha | null>(null);
  const [paradaSelecionada, setParadaSelecionada] = useState<Parada | null>(null);
  const mapaRef = useRef<MapaRef>(null);

  const handleLinhaSelect = (linha: Linha) => {
    setLinhaSelecionada(linha);

    if (GA_MEASUREMENT_ID) {
      ReactGA.event({
        category: "Mapa",
        action: "Ver Linha",
        label: `${linha.nome} - ${linha.sublinha || "Principal"}`,
      });
    }
  };

  const handleParadaClick = (parada: Parada) => {
    setParadaSelecionada(parada);
    mapaRef.current?.centralizarParada(parada);

    if (GA_MEASUREMENT_ID) {
      ReactGA.event({
        category: "Mapa",
        action: "Ver Parada",
        label: parada.nome,
      });
    }
  };

  // Validação dos dados
  if (!paradasData.paradas || paradasData.paradas.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100 text-gray-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">⚠️ Dados não encontrados</h2>
          <p>Verifique se os arquivos na pasta <code>/data</code> estão corretos.</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="relative h-screen w-screen overflow-hidden flex flex-col md:flex-row font-['Poppins',_sans-serif] bg-background">
        <MenuLateral
          linhasData={linhasData}
          todasParadas={paradasData.paradas}
          onLinhaSelect={handleLinhaSelect}
          onParadaClick={handleParadaClick}
          linhaSelecionada={linhaSelecionada}
        />
        <div className="flex-grow h-full w-full">
          <Mapa
            ref={mapaRef}
            todasParadas={paradasData.paradas}
            linhaSelecionada={linhaSelecionada}
            paradaSelecionada={paradaSelecionada}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}