import 'maplibre-gl/dist/maplibre-gl.css';
import { Compass, CornerUpLeft, LoaderCircle, LocateFixed, Radio, Square } from 'lucide-react';
import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import type { MapaRef } from '@/contexts/RotasSelectionContext';
import type { GpsTrackingState } from '@/features/gps/hooks/useGpsTrackingSession';
import { CAMPUS_DISPLAY_NAME, COORDENADAS_CAMPUS } from '@/hooks/useLocalizacaoUsuario';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import type { Linha, Parada } from '@/types/data.types';
import { MapPitchHint } from '../MapPitchHint';
import { TILE_PROVIDERS, type TileProviderKey } from '../TileSwitcher';
import { MapLibreAllBusMarkers } from './MapLibreAllBusMarkers';
import { MapLibreGpsLiveBusMarker } from './MapLibreGpsLiveBusMarker';
import { MapLibreGpsRouteOverlay } from './MapLibreGpsRouteOverlay';
import { MapLibreParadasLayer } from './MapLibreParadasLayer';
import { MapLibrePlannerOverlay } from './MapLibrePlannerOverlay';
import { MapLibrePrediosLayer } from './MapLibrePrediosLayer';
import { MapLibreRotasLayer } from './MapLibreRotasLayer';
import { MapLibreUserMarker } from './MapLibreUserMarker';

export type { MapaRef };

// COORDENADAS_CAMPUS é [lat, lng]; MapLibre usa [lng, lat]
const CAMPUS_LNG = COORDENADAS_CAMPUS[1];
const CAMPUS_LAT = COORDENADAS_CAMPUS[0];

const TILE_KEY = 'tile-provider';
const DEFAULT_PROVIDER: TileProviderKey = 'osm';

function getStoredProvider(): TileProviderKey {
  try {
    const v = localStorage.getItem(TILE_KEY);
    if (v && v in TILE_PROVIDERS) return v as TileProviderKey;
  } catch {}
  return DEFAULT_PROVIDER;
}

function toMaplibreTiles(leafletUrl: string): string[] {
  const base = leafletUrl.replace('{r}', '');

  if (base.includes('{s}')) {
    return ['a', 'b', 'c', 'd'].map((s) => base.replace('{s}.', `${s}.`).replace('{s}', s));
  }
  return [base];
}

export interface MapLibreViewProps {
  todasParadas: Parada[];
  linhasAtivas: Linha[];
  linhaSelecionada: Linha | null;
  paradaSelecionada: Parada | null;
  localizacaoUsuario?: [number, number] | null;
  headingUsuario?: number | null;
  /** Se o modo bússola (rotação automática por heading do dispositivo) está ativo */
  compassEnabled?: boolean;
  /** Callback para alternar o modo bússola */
  onToggleCompass?: () => void;
  permissaoLocalizacao?: boolean;
  onPedirLocalizacao?: () => void;
  carregandoLocalizacao?: boolean;
  rastreioColaborativo?: GpsTrackingState;
  onAlternarRastreioColaborativo?: () => void;
  ref?: Ref<MapaRef>;
}

export function MapLibreView({
  todasParadas,
  linhasAtivas,
  linhaSelecionada,
  paradaSelecionada,
  localizacaoUsuario,
  headingUsuario,
  compassEnabled = false,
  onToggleCompass,
  permissaoLocalizacao = false,
  onPedirLocalizacao,
  carregandoLocalizacao = false,
  rastreioColaborativo,
  onAlternarRastreioColaborativo,
  ref,
}: MapLibreViewProps) {
  const analytics = useAnalytics();
  const mapRef = useRef<MapRef>(null);
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [tileProvider] = useState<TileProviderKey>(getStoredProvider);

  const mapStyle = useMemo(() => {
    const provider = TILE_PROVIDERS[tileProvider];
    const tiles = toMaplibreTiles(provider.url);
    return {
      version: 8 as const,
      sources: {
        'raster-tiles': {
          type: 'raster' as const,
          tiles,
          tileSize: 256,
          attribution: provider.attribution,
        },
      },
      layers: [
        {
          id: 'raster-tiles',
          type: 'raster' as const,
          source: 'raster-tiles',
        },
      ],
    };
  }, [tileProvider]);

  // Expõe API imperativa para centralizar paradas/coordenadas programaticamente
  useImperativeHandle(
    ref,
    () => ({
      centralizarParada: (parada: Parada) => {
        const [lat, lng] = parada.coordenadas;
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 17, duration: 800 });
      },
      centralizarCoordenada: (coords: [number, number], zoom = 15) => {
        const [lat, lng] = coords;
        mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1000 });
      },
    }),
    [],
  );

  const handleResetNorth = useCallback(() => {
    mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 500 });
    setBearing(0);
    setPitch(0);
  }, []);

  // Bússola: ativa → desativa e reseta norte; inativa → ativa heading follow
  const handleCompass = useCallback(() => {
    if (compassEnabled) {
      onToggleCompass?.();
      mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 500 });
      setBearing(0);
      setPitch(0);
    } else {
      onToggleCompass?.();
    }
  }, [compassEnabled, onToggleCompass]);

  const handleCentroCampus = useCallback(() => {
    mapRef.current?.flyTo({ center: [CAMPUS_LNG, CAMPUS_LAT], zoom: 15 });
    analytics.trackEvent({ category: 'map_interaction', action: 'center_campus_3d' });
  }, [analytics]);

  const handleCentralizar = useCallback(() => {
    analytics.trackEvent({ category: 'map_interaction', action: 'click_gps_3d' });
    if (!permissaoLocalizacao) {
      onPedirLocalizacao?.();
      return;
    }
    if (localizacaoUsuario) {
      const [lat, lng] = localizacaoUsuario;
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 17 });
    }
  }, [permissaoLocalizacao, onPedirLocalizacao, localizacaoUsuario, analytics]);

  const paradaDestacadaId = paradaSelecionada?.idParada ?? null;

  // Centraliza na parada selecionada
  useEffect(() => {
    if (!paradaSelecionada) return;
    const [lat, lng] = paradaSelecionada.coordenadas;
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 17, duration: 800 });
  }, [paradaSelecionada]);

  // Ajusta bounds para linha selecionada
  useEffect(() => {
    if (!linhaSelecionada?.coordenadasTrajeto?.length) return;
    const coords = linhaSelecionada.coordenadasTrajeto;
    const lngs = coords.map(([, lng]) => lng);
    const lats = coords.map(([lat]) => lat);
    mapRef.current?.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 40, duration: 800 },
    );
  }, [linhaSelecionada]);

  // Rotaciona o mapa conforme o heading do dispositivo quando bússola está ativa
  useEffect(() => {
    if (!compassEnabled || headingUsuario === null || headingUsuario === undefined) return;
    mapRef.current?.easeTo({ bearing: headingUsuario, duration: 200 });
    setBearing(headingUsuario);
  }, [compassEnabled, headingUsuario]);

  const isNorth = Math.abs(bearing) < 1 && Math.abs(pitch) < 1;
  const statusRastreio = rastreioColaborativo?.status ?? 'idle';
  const rastreioAtivo = Boolean(rastreioColaborativo?.isActive);

  return (
    <div className="relative h-full w-full">
      <MapPitchHint visible={true} />

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: CAMPUS_LNG,
          latitude: CAMPUS_LAT,
          zoom: 15,
          pitch: 0,
          bearing: 0,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        pitchWithRotate
        touchPitch
        onPitch={(e) => setPitch(e.target.getPitch())}
        onRotate={(e) => setBearing(e.target.getBearing())}
        attributionControl={false}
      >
        <MapLibrePlannerOverlay />

        {rastreioColaborativo?.isActive && linhaSelecionada && (
          <MapLibreGpsRouteOverlay linha={linhaSelecionada} />
        )}

        <MapLibrePrediosLayer pitch={pitch} />

        <MapLibreRotasLayer linha={linhaSelecionada} />

        <MapLibreParadasLayer paradas={todasParadas} paradaDestacadaId={paradaDestacadaId} />

        <MapLibreAllBusMarkers
          linhas={linhasAtivas}
          todasParadas={todasParadas}
          linhaNumeroExcluido={linhaSelecionada?.linha ?? null}
        />

        {linhaSelecionada && (
          <MapLibreGpsLiveBusMarker
            key={linhaSelecionada.idRota}
            linha={linhaSelecionada}
            todasParadas={todasParadas}
          />
        )}

        {localizacaoUsuario && (
          <MapLibreUserMarker
            localizacao={localizacaoUsuario}
            heading={headingUsuario ?? null}
          />
        )}
      </Map>

      {/* FABs — fora do <Map> mas dentro do container relativo */}
      <div className="pointer-events-none fixed bottom-24 right-4 z-1000 flex flex-col items-end gap-2 [margin-bottom:env(safe-area-inset-bottom)] md:bottom-6 md:[margin-bottom:0]">
        {rastreioColaborativo && onAlternarRastreioColaborativo ? (
          <button
            type="button"
            onClick={onAlternarRastreioColaborativo}
            aria-pressed={rastreioAtivo}
            aria-label={
              rastreioAtivo
                ? `Encerrar ${rastreioColaborativo.label}. Status: ${statusRastreio}`
                : `Iniciar ${rastreioColaborativo.label}`
            }
            className={cn(
              'pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center neo-brutal transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
              rastreioAtivo
                ? 'border-success-border bg-success-border text-white'
                : 'bg-card text-text-primary hover:bg-card-hover',
            )}
          >
            {rastreioAtivo ? (
              <Square className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Radio className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleCentroCampus}
          aria-label={`Centralizar mapa em ${CAMPUS_DISPLAY_NAME}`}
          title={`Centralizar mapa em ${CAMPUS_DISPLAY_NAME}`}
          className={cn(
            'pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center neo-brutal transition-all duration-200',
            'bg-card text-text-primary hover:bg-card-hover',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
          )}
        >
          <CornerUpLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Bússola — ativa heading follow; quando ativo, fica destacado e clicar desativa + reseta norte */}
        <button
          type="button"
          onClick={handleCompass}
          aria-pressed={compassEnabled}
          aria-label={
            compassEnabled
              ? 'Desativar bússola'
              : isNorth
                ? 'Ativar bússola — mapa girará com o dispositivo'
                : 'Resetar orientação ao norte ou ativar bússola'
          }
          title={compassEnabled ? 'Desativar bússola' : 'Ativar bússola'}
          className={cn(
            'pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center neo-brutal transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
            compassEnabled
              ? 'border-brand-primary bg-brand-primary text-white'
              : isNorth
                ? 'bg-card text-text-secondary'
                : 'border-brand-primary bg-brand-primary/10 text-brand-primary',
          )}
        >
          <Compass
            className="h-5 w-5"
            aria-hidden="true"
            style={{ transform: `rotate(${-bearing}deg)`, transition: 'transform 0.2s ease' }}
          />
        </button>

        <button
          type="button"
          onClick={handleCentralizar}
          disabled={carregandoLocalizacao}
          aria-busy={carregandoLocalizacao}
          aria-label={
            carregandoLocalizacao
              ? 'Buscando localização...'
              : permissaoLocalizacao
                ? 'Centralizar mapa na minha localização'
                : 'Ativar localização'
          }
          className={cn(
            'pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center neo-brutal transition-all duration-200',
            'bg-brand-primary text-white hover:bg-brand-primary/90',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-70',
          )}
        >
          {carregandoLocalizacao ? (
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
