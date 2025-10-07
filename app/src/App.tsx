import { useState, useEffect, useMemo } from "react";
import ReactGA from "react-ga4";
import { MenuLateral } from "./components/MenuLateral";
import { Mapa } from "./components/Mapa";

// Importa os ficheiros JSON

import dadosLinhas from "./data/dadosLinhas";

import { Trajeto, Parada, Linha } from "./types/data.types";

// Lê a ID de Medição a partir das variáveis de ambiente
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Inicializa o Google Analytics APENAS se a ID existir
if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}

export function App() {
  
  
    // Usa a informação da rota clicada para o evento do Analytics
    ReactGA.event({
      category: "Mapa",
      action: "Ver Rota",
      label: `${linhaInfo.nome} - ${linhaInfo.sublinha || "Principal"}`,
    });
  };

  if (!paradasData.length || !rotasParaMapa.length) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100 text-gray-800">
        <div>
          <h2 className="text-2xl font-bold mb-2">Dados não encontrados</h2>
          <p>Verifique se os arquivos GeoJSON estão corretos e recarregue a página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col md:flex-row font-['Poppins',_sans-serif]">
      <MenuLateral linhasData={dadosLinhas} onLinhaClick={handleLinhaClick} />
      <div className="flex-grow h-full w-full">
        <Mapa
          paradas={paradasData}
          rotaSelecionada={
            rotaSelecionada !== null && rotasParaMapa[rotaSelecionada] ? rotasParaMapa[rotaSelecionada] : null
          }
        />
      </div>
    </div>
  );
}