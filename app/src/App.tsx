import { useState, useEffect, useMemo } from "react";
import ReactGA from "react-ga4";
// import { MenuLateral } from "./components/MenuLateral";
import { Mapa } from "./components/Mapa";

// Importa os ficheiros GeoJSON
import paradasGeojson from "./data/paradas.geojson";
import rotasGeojson from "./data/rotas.geojson";

import { Rota, Parada, RotaFeature, ParadaFeature, FeatureCollection } from "./types/data.types";


// Lê a ID de Medição a partir das variáveis de ambiente
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Inicializa o Google Analytics APENAS se a ID existir
if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}

export function App() {
  // --- PROCESSAMENTO DOS DADOS GEOJSON ---
  // O useMemo garante que esta transformação pesada só aconteça uma vez.
  // const rotasData: Linha[] = useMemo(() => 
  //   (rotasGeojson as FeatureCollection<RotaFeature>).features.map((feature) => ({
  //     // Mapeia as propriedades do GeoJSON para a nossa interface 'Linha'
  //     idRota: feature.properties.id_rota,
  //     nome: feature.properties.nome_display,
  //     tipo: feature.properties.categoria || "",
  //     sublinha: feature.properties.variante_nome || null,
  //     categoriaDia: feature.properties.categoria,
  //     idCor: feature.properties.identificador_cor_tema,
  //     corHex: feature.properties.cor_hex_leaflet,
  //     horarios: feature.properties.horarios,
  //     itinerario: feature.properties.itinerario_paradas_ids,
  //   }))
  // , []);
  console.log('paradasGeojson:', paradasGeojson);
  console.log('rotasGeojson:', rotasGeojson);
  const paradasData: Parada[] = useMemo(() =>
    (paradasGeojson as FeatureCollection<ParadaFeature>).features.map((feature) => ({
      // Mapeia as propriedades do GeoJSON para a nossa interface 'Parada'
      idParada: feature.properties.id_parada,
      nome: feature.properties.nome,
      linhaAtendidas: feature.properties.linhasAtendidasNomes,
      // INVERTE as coordenadas de [longitude, latitude] para [latitude, longitude]
      coordinates: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
    }))
  , []);
  const rotasParaMapa: Rota[] = useMemo(() =>
    (rotasGeojson as FeatureCollection<RotaFeature>).features.map((feature) => ({
      // Cria a estrutura de dados específica para o componente do Mapa
      linha: feature.properties.id_rota,
      sublinha: feature.properties.variante_nome || null,
      cor: feature.properties.cor_hex_leaflet,
      // INVERTE cada par de coordenadas no traçado da rota
      coordinates: feature.geometry.coordinates.map(coord => [coord[1], coord[0]]),
    }))
  , []);

  // --- ESTADO DO COMPONENTE ---
  // Seleciona a primeira rota por padrão, se houver
  const [rotaSelecionada] = useState<number | null>(rotasParaMapa.length > 0 ? 0 : null);

  useEffect(() => {
    // Envia um evento de pageview quando a aplicação carrega
    ReactGA.send({
      hitType: "pageview",
      page: window.location.pathname,
      title: "Página Inicial",
    });
  }, []);

  // const handleLinhaClick = (index: number) => {
  //   setRotaSelecionada(index);
  //
  //   // Usa a informação da rota clicada para o evento do Analytics
  //   const linhaInfo = rotasData[index];
  //   ReactGA.event({
  //     category: "Mapa",
  //     action: "Ver Rota",
  //     label: `${linhaInfo.nome} - ${linhaInfo.sublinha || "Principal"}`,
  //   });
  // };

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