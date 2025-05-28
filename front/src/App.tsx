import { useState, useEffect } from "react";
import ReactGA from "react-ga4";
import { MenuLateral } from "./components/MenuLateral";
import { Mapa } from "./components/Mapa";
import linhasData from "./data/dadosLinhas";
import rotasData from "./data/dadosRotas";
import { Linha } from "./types/data.types";

// Lê a ID de Medição a partir das variáveis de ambiente
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Inicializa o Google Analytics APENAS se a ID existir
if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}
export function App() {
  const [rotaSelecionada, setRotaSelecionada] = useState<number | null>(null);

  useEffect(() => {
    // Envia um evento de pageview quando a aplicação carrega
    ReactGA.send({
      hitType: "pageview",
      page: window.location.pathname,
      title: "Página Inicial",
    });
  }, []);

  const handleLinhaClick = (index: number, linhaInfo: Linha) => {
    setRotaSelecionada(index);
    ReactGA.event({
      category: "Mapa",
      action: "Ver Rota",
      label: `${linhaInfo.nome} - ${linhaInfo.sublinha || "Principal"}`,
    });
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col md:flex-row font-['Poppins',_sans-serif]">
      <MenuLateral linhasData={linhasData} onLinhaClick={handleLinhaClick} />
      <div className="flex-grow h-full w-full">
        <Mapa
          paradas={rotasData.paradas}
          rotaSelecionada={
            rotaSelecionada !== null ? rotasData.rotas[rotaSelecionada] : null
          }
          coresLinhas={[
            "#8A2BE2",
            "#B22222",
            "#006400",
            "#00008B",
            "#800020",
            "#4B0082",
            "#D2691E",
          ]}
        />
      </div>
    </div>
  );
}
