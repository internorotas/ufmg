import { useState, useEffect, useMemo } from "react";
import ReactGA from "react-ga4";
import { MenuLateral } from "./components/MenuLateral";
import { Mapa } from "./components/Mapa";

// Importa os ficheiros JSON
import paradasGeojson from "./data/paradas-old.json";
import rotasGeojson from "./data/rotas-old.json";
import dadosLinhas from "./data/dadosLinhas";

import { Rota, Parada, RotaFeature, ParadaFeature, FeatureCollection, Linha } from "./types/data.types";


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
  
  const paradasData: Parada[] = useMemo(() => {
    if (!paradasGeojson?.features) {
      console.warn('paradasGeojson não tem features:', paradasGeojson);
      return [];
    }
    return (paradasGeojson as FeatureCollection<ParadaFeature>).features.map((feature) => ({
      // Mapeia as propriedades do GeoJSON para a nossa interface 'Parada'
      idParada: feature.properties.id_parada,
      nome: feature.properties.nome,
      linhaAtendidas: feature.properties.linhasAtendidasNomes,
      // INVERTE as coordenadas de [longitude, latitude] para [latitude, longitude]
      coordinates: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
    }));
  }, []);
  
  const rotasParaMapa: Rota[] = useMemo(() => {
    if (!rotasGeojson?.features) {
      console.warn('rotasGeojson não tem features:', rotasGeojson);
      return [];
    }
    
    // Função para validar e corrigir coordenadas
    const isValidCoordinate = (coord: number[]): boolean => {
      const [lng, lat] = coord;
      // Para Belo Horizonte: longitude ~-43.9, latitude ~-19.8
      return lng >= -44.5 && lng <= -43.0 && lat >= -20.5 && lat <= -19.0;
    };
    
    return (rotasGeojson as FeatureCollection<RotaFeature>).features
      .filter((feature) => {
        const coords = feature.geometry.coordinates;
        if (!coords || coords.length === 0) return false;
        
        // Verificar se pelo menos algumas coordenadas são válidas
        const validCoords = coords.filter(isValidCoordinate);
        const isValid = validCoords.length > coords.length * 0.1; // Pelo menos 10% das coordenadas devem ser válidas
        
        if (!isValid) {
          console.warn(`Rota ${feature.properties.id_rota} tem coordenadas inválidas, pulando...`);
        }
        
        return isValid;
      })
      .map((feature) => ({
        // Cria a estrutura de dados específica para o componente do Mapa
        linha: feature.properties.id_rota,
        sublinha: feature.properties.variante_nome || null,
        cor: feature.properties.cor_hex_leaflet,
        // Filtrar coordenadas válidas e INVERTER para [latitude, longitude]
        coordinates: feature.geometry.coordinates
          .filter(isValidCoordinate)
          .map(coord => [coord[1], coord[0]]),
      }));
  }, []);

  // --- ESTADO DO COMPONENTE ---
  // Seleciona a primeira rota por padrão, se houver
  const [rotaSelecionada, setRotaSelecionada] = useState<number | null>(rotasParaMapa.length > 0 ? 0 : null);

  useEffect(() => {
    // Envia um evento de pageview quando a aplicação carrega
    ReactGA.send({
      hitType: "pageview",
      page: window.location.pathname,
      title: "Página Inicial",
    });
  }, []);

  const handleLinhaClick = (_index: number, linhaInfo: Linha) => {
    // Mapear linha para id_rota baseado no padrão dos dados
    let targetRouteId = '';
    
    if (linhaInfo.linha) {
      switch (linhaInfo.linha) {
        case 1: // Linha 01 - Dias Úteis ✅ VÁLIDA
          targetRouteId = 'DU_1_0';
          break;
        case 2: // Linha 02 - Dias Úteis ❌ CORROMPIDA
          console.warn('Linha 2 temporariamente desabilitada - coordenadas corrompidas');
          return;
        case 3: // Linha 03 - Dias Úteis ✅ VÁLIDA
          targetRouteId = 'DU_3_null_3';
          break;
        case 4: // Linha 04 - Dias Úteis ❌ CORROMPIDA
          console.warn('Linha 4 temporariamente desabilitada - coordenadas corrompidas');
          return;
        case 5: // Linha 03 - Sábado ❌ CORROMPIDA
          console.warn('Linha Sábado temporariamente desabilitada - coordenadas corrompidas');
          return;
        case 6: // Linha 02 - Férias ❌ CORROMPIDA
          console.warn('Linha Férias 2 temporariamente desabilitada - coordenadas corrompidas');
          return;
        case 7: // Linha 03 - Férias ❌ CORROMPIDA
          console.warn('Linha Férias 3 temporariamente desabilitada - coordenadas corrompidas');
          return;
        default:
          console.warn('ID da linha não mapeado:', linhaInfo.linha);
      }
    }
    
    // Encontrar a rota correspondente no rotasParaMapa
    const rotaIndex = rotasParaMapa.findIndex(rota => rota.linha === targetRouteId);
    setRotaSelecionada(rotaIndex >= 0 ? rotaIndex : null);

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