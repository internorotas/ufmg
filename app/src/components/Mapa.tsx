/**
 * Componente principal do Mapa - Container limpo usando Composition Pattern.
 *
 * Este componente foi refatorado para delegar responsabilidades:
 * - MapMarkers: Renderização dos marcadores de paradas
 * - MapRoute: Renderização da rota animada
 * - MapControls: Controles de visualização (zoom, centralização)
 * - ControlesUsuarioMapa: Localização do usuário e FAB
 * - TileSwitcher: Seleção de camada de tiles
 * - UfmgPrediosLayer: Prédios da UFMG em GeoJSON
 * - MapRotationHandler: Rotação via bússola
 *
 * Atualizado para React 19: ref como prop (sem forwardRef)
 */

import { X } from 'lucide-react';
import { type Ref, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useRotasSelection } from '@/contexts/RotasContext';
import { AllLinesBusMarkers } from '@/features/gps/components/AllLinesBusMarkers';
import { GpsLiveBusMarker } from '@/features/gps/components/GpsLiveBusMarker';
import { GpsRouteOverlay } from '@/features/gps/components/GpsRouteOverlay';
import type { GpsTrackingState } from '@/features/gps/hooks/useGpsTrackingSession';
import { PlannerMapOverlay } from '@/features/planner/components/PlannerMapOverlay';
import { COORDENADAS_CAMPUS } from '@/hooks/useLocalizacaoUsuario';
import { useAnalytics } from '../hooks/useAnalytics';
import type { Linha, Parada } from '../types/data.types';
import { ControlesUsuarioMapa } from './ControlesUsuarioMapa';
import {
  CenterOnParada,
  ChangeView,
  MapMarkers,
  MapRotationHandler,
  MapRoute,
  TileSwitcher,
  UfmgPrediosLayer,
  useMapMarkers,
  useRouteBounds,
} from './map';

export interface MapaRef {
  centralizarParada: (parada: Parada) => void;
  centralizarCoordenada: (coords: [number, number], zoom?: number) => void;
}

interface MapaProps {
  todasParadas: Parada[];
  linhasAtivas: Linha[];
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
  rastreioColaborativo?: GpsTrackingState;
  onAlternarRastreioColaborativo?: () => void;
  /** Ref para expor métodos do mapa (React 19 - ref como prop) */
  ref?: Ref<MapaRef>;
}

/**
 * Configurações padrão do mapa
 */
const MAP_CONFIG = {
  center: COORDENADAS_CAMPUS,
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
  linhasAtivas,
  linhaSelecionada,
  paradaSelecionada,
  localizacaoUsuario,
  headingUsuario,
  permissaoLocalizacao = false,
  onPedirLocalizacao,
  carregandoLocalizacao = false,
  rastreioColaborativo,
  onAlternarRastreioColaborativo,
  ref,
}: MapaProps) {
  const { trackTiming } = useAnalytics();
  const { limparSelecao } = useRotasSelection();
  const mapLoadStartRef = useRef<number>(0);

  const { paradaDestacadaId, handleMarkerRef, destacarParada } = useMapMarkers();

  const bounds = useRouteBounds(linhaSelecionada);

  const [compassEnabled, setCompassEnabled] = useState(() => {
    try {
      return localStorage.getItem('compass-follow') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCompass = useCallback(() => {
    setCompassEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('compass-follow', String(next));
      } catch {
        // localStorage indisponível
      }
      return next;
    });
  }, []);

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
    <div className="relative h-full w-full">
      {linhaSelecionada && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-1000 flex justify-center px-3">
          <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full bg-card/95 py-1.5 pl-2 pr-1.5 shadow-(--elevation-2) ring-1 ring-card-border backdrop-blur">
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-extrabold text-white"
              style={{ background: linhaSelecionada.corHex }}
            >
              {linhaSelecionada.linha}
            </span>
            <span className="min-w-0 truncate text-xs font-semibold text-text-primary">
              {linhaSelecionada.nome}
            </span>
            <button
              type="button"
              onClick={limparSelecao}
              aria-label="Limpar seleção da linha"
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-card-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <MapContainer
        center={MAP_CONFIG.center}
        zoom={MAP_CONFIG.zoom}
        className="h-full w-full"
        zoomControl={true}
        rotation={true}
        whenReady={() => {}}
      >
        <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.attribution} />
        <TileSwitcher />
        <UfmgPrediosLayer />
        <MapRotationHandler heading={headingUsuario ?? null} enabled={compassEnabled} />

        <ChangeView bounds={bounds} />
        <CenterOnParada parada={paradaSelecionada} />

        <MapRoute linha={linhaSelecionada} />

        {rastreioColaborativo?.isActive && linhaSelecionada && (
          <GpsRouteOverlay linha={linhaSelecionada} />
        )}

        <AllLinesBusMarkers
          linhas={linhasAtivas}
          todasParadas={todasParadas}
          linhaNumeroExcluido={linhaSelecionada?.linha ?? null}
        />

        {linhaSelecionada && (
          <GpsLiveBusMarker
            key={linhaSelecionada.idRota}
            linha={linhaSelecionada}
            todasParadas={todasParadas}
          />
        )}

        <PlannerMapOverlay />

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
            rastreioColaborativo={rastreioColaborativo}
            onAlternarRastreioColaborativo={onAlternarRastreioColaborativo}
            compassEnabled={compassEnabled}
            onToggleCompass={toggleCompass}
          />
        )}

        <MapImperativeHandler mapaRef={ref} destacarParada={destacarParada} />
      </MapContainer>
    </div>
  );
}
