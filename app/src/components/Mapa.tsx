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
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useAnalytics } from '../hooks/useAnalytics';
import type { Linha, Parada } from '../types/data.types';
import { ControlesUsuarioMapa } from './ControlesUsuarioMapa';
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
  /** Estado de carregamento de geolocalização */
  carregandoLocalizacao?: boolean;
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
  carregandoLocalizacao = false,
  ref,
}: MapaProps) {
  const { trackTiming } = useAnalytics();
  const mapLoadStartRef = useRef<number>(0);

  const { paradaDestacadaId, handleMarkerRef, destacarParada } = useMapMarkers();

  const bounds = useRouteBounds(linhaSelecionada);

  useEffect(() => {
    if (mapLoadStartRef.current === 0) {
      mapLoadStartRef.current = Date.now();
    }
    const loadTime = Date.now() - mapLoadStartRef.current;
    trackTiming({
      name: 'map_load_time',
      value: loadTime,
      category: 'navigation',
      label: 'initial_map_render',
    });
  }, [trackTiming]);

  return (
    <MapContainer
      center={MAP_CONFIG.center}
      zoom={MAP_CONFIG.zoom}
      className="h-full w-full"
      zoomControl={true}
      whenReady={() => {}}
    >
      <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.attribution} />

      <ChangeView bounds={bounds} />
      <CenterOnParada parada={paradaSelecionada} />

      <MapRoute linha={linhaSelecionada} />

      <MapMarkers
        paradas={todasParadas}
        paradaDestacadaId={paradaDestacadaId}
        onMarkerRef={handleMarkerRef}
      />

      {onPedirLocalizacao && (
        <ControlesUsuarioMapa
          localizacao={localizacaoUsuario ?? null}
          heading={headingUsuario ?? null}
          permissaoConcedida={permissaoLocalizacao}
          onPedirLocalizacao={onPedirLocalizacao}
          carregandoLocalizacao={carregandoLocalizacao}
        />
      )}

      <MapImperativeHandler mapaRef={ref} destacarParada={destacarParada} />
    </MapContainer>
  );
}
