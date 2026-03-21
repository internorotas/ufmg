/**
 * Componente principal do Mapa - Container limpo usando Composition Pattern.
 *
 * Este componente foi refatorado para delegar responsabilidades:
 * - MapMarkers: Renderização dos marcadores de paradas
 * - MapRoute: Renderização da rota animada
 * - MapControls: Controles de visualização (zoom, centralização)
 * - ControlesUsuarioMapa: Localização do usuário e FAB
 *
 * Atualizado para React 19: ref como prop (sem forwardRef)
 */

import { type Ref, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useAnalytics } from '../hooks/useAnalytics';
import type { Linha, Parada } from '../types/data.types';
import { ControlesUsuarioMapa } from './ControlesUsuarioMapa';
// Componentes extraídos (Strategy/Composition Pattern)
import {
  CenterOnParada,
  ChangeView,
  MapMarkers,
  MapRoute,
  useMapMarkers,
  useRouteBounds,
} from './map';

export interface MapaRef {
  centralizarParada: (parada: Parada) => void;
  centralizarCoordenada: (coords: [number, number], zoom?: number) => void;
}

interface MapaProps {
  todasParadas: Parada[];
  linhaSelecionada: Linha | null;
  paradaSelecionada: Parada | null;
  /** Coordenadas do usuário [lat, lng] */
  localizacaoUsuario?: [number, number] | null;
  /** Direção da bússola em graus (0 = Norte) */
  headingUsuario?: number | null;
  /** Se a permissão de GPS foi concedida */
  permissaoLocalizacao?: boolean;
  /** Callback para abrir modal de permissão */
  onPedirLocalizacao?: () => void;
  /** Ref para expor métodos do mapa (React 19 - ref como prop) */
  ref?: Ref<MapaRef>;
}

/**
 * Configurações padrão do mapa
 */
const MAP_CONFIG = {
  center: [-19.87055, -43.96775] as [number, number],
  zoom: 15,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
};

/**
 * Renderiza um mapa interativo com as paradas e rotas de ônibus.
 * Componente container que orquestra os sub-componentes do mapa.
 *
 * React 19: ref é recebida diretamente como prop, sem necessidade de forwardRef.
 */
/**
 * Componente interno para gerenciar imperativeHandle
 * Precisa estar dentro do MapContainer para usar useMap()
 */
function MapImperativeHandler({
  mapaRef,
  destacarParada,
}: {
  mapaRef: Ref<MapaRef> | undefined;
  destacarParada: (parada: Parada) => void;
}) {
  const map = useMap();

  const centralizarCoordenada = useCallback(
    (coords: [number, number], zoom = 15) => {
      map.flyTo(coords, zoom, { duration: 1 });
    },
    [map],
  );

  useImperativeHandle(mapaRef, () => ({
    centralizarParada: destacarParada,
    centralizarCoordenada,
  }));

  return null;
}

export function Mapa({
  todasParadas,
  linhaSelecionada,
  paradaSelecionada,
  localizacaoUsuario,
  headingUsuario,
  permissaoLocalizacao = false,
  onPedirLocalizacao,
  ref,
}: MapaProps) {
  const { trackTiming } = useAnalytics();
  const mapLoadStartRef = useRef<number>(0);

  // Hook para gerenciar marcadores
  const { paradaDestacadaId, handleMarkerRef, destacarParada } = useMapMarkers();

  // Hook para calcular bounds da rota
  const bounds = useRouteBounds(linhaSelecionada);

  // Rastreia o tempo de carregamento do mapa
  useEffect(() => {
    if (mapLoadStartRef.current === 0) {
      mapLoadStartRef.current = Date.now();
    }
    const loadTime = Date.now() - mapLoadStartRef.current;
    trackTiming({
      name: 'Map Load Time',
      value: loadTime,
      category: 'Performance',
      label: 'Initial Map Render',
    });
  }, [trackTiming]);

  return (
    <MapContainer
      center={MAP_CONFIG.center}
      zoom={MAP_CONFIG.zoom}
      className="h-full w-full"
      zoomControl={true}
      whenReady={() => {
        // Map is ready
      }}
    >
      {/* Camada de tiles */}
      <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.attribution} />

      {/* Controles de visualização */}
      <ChangeView bounds={bounds} />
      <CenterOnParada parada={paradaSelecionada} />

      {/* Rota animada da linha selecionada */}
      <MapRoute linha={linhaSelecionada} />

      {/* Marcadores de paradas */}
      <MapMarkers
        paradas={todasParadas}
        paradaDestacadaId={paradaDestacadaId}
        onMarkerRef={handleMarkerRef}
      />

      {/* Controles de localização do usuário */}
      {onPedirLocalizacao && (
        <ControlesUsuarioMapa
          localizacao={localizacaoUsuario ?? null}
          heading={headingUsuario ?? null}
          permissaoConcedida={permissaoLocalizacao}
          onPedirLocalizacao={onPedirLocalizacao}
        />
      )}

      {/* Handler para imperative ref (precisa estar dentro do MapContainer) */}
      <MapImperativeHandler mapaRef={ref} destacarParada={destacarParada} />
    </MapContainer>
  );
}
