import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Box,
  Compass,
  CornerUpLeft,
  LoaderCircle,
  LocateFixed,
  Minus,
  Plus,
  Radio,
  Search,
  Share2,
  Square,
  X,
} from 'lucide-react';
import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import MapLibreMap, { type MapRef } from 'react-map-gl/maplibre';
import { Tooltip } from '@/components/ui/Tooltip';
import type { MapaRef } from '@/contexts/RotasSelectionContext';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import type { GpsTrackingState } from '@/features/gps/hooks/useGpsTrackingSession';
import { useAnalytics } from '@/hooks/useAnalytics';
import { CAMPUS_DISPLAY_NAME, COORDENADAS_CAMPUS } from '@/hooks/useLocalizacaoUsuario';
import { buildParadaShareUrl } from '@/lib/shareLinks';
import { cn } from '@/lib/utils';
import type { Linha, Parada } from '@/types/data.types';
import { MapPitchHint } from '../MapPitchHint';
import { TILE_PROVIDERS, type TileProviderKey } from '../tileProviders';
import { MapLibreAllBusMarkers } from './MapLibreAllBusMarkers';
import { MapLibreBhtransMarkers } from './MapLibreBhtransMarkers';
import { MapLibreGpsLiveBusMarker } from './MapLibreGpsLiveBusMarker';
import { MapLibreGpsRouteOverlay } from './MapLibreGpsRouteOverlay';
import { ConteudoPopupParada, MapLibreParadasLayer } from './MapLibreParadasLayer';
import { MapLibrePlannerOverlay } from './MapLibrePlannerOverlay';
import { CardPredio, MapLibrePrediosLayer, type PredioInfo } from './MapLibrePrediosLayer';
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
    // Usar apenas a, b, c — OSM e CartoDB suportam esses três subdomínios
    return ['a', 'b', 'c'].map((s) => base.replace('{s}.', `${s}.`).replace('{s}', s));
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
  onOpenSearch?: () => void;
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
  onOpenSearch,
  ref,
}: MapLibreViewProps) {
  const { isAuthenticated } = useAuthContext();
  const analytics = useAnalytics();
  const mapRef = useRef<MapRef>(null);
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [is3d, setIs3d] = useState(false);
  const [tileProvider] = useState<TileProviderKey>(getStoredProvider);
  const [paradaAberta, setParadaAberta] = useState<Parada | null>(null);
  const [predioAberto, setPredioAberto] = useState<PredioInfo | null>(null);

  // Exclusão mútua: abrir parada fecha prédio e vice-versa
  const openParada = useCallback((parada: Parada | null) => {
    setParadaAberta(parada);
    if (parada) setPredioAberto(null);
  }, []);

  const openPredio = useCallback((predio: PredioInfo | null) => {
    setPredioAberto(predio);
    if (predio) setParadaAberta(null);
  }, []);

  const handleMapClick = useCallback((e: { originalEvent: MouseEvent }) => {
    // Se um layer click (ex: prédio) já chamou preventDefault(), ignorar o click global.
    // MapLibre dispara layer event + map event para o mesmo click nativo.
    if (e.originalEvent.defaultPrevented) return;
    setParadaAberta(null);
    setPredioAberto(null);
  }, []);

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

  // Botão 3D: alterna pitch 0↔60. Ao voltar ao 2D, desativa bússola se estiver ativa.
  const handleToggle3d = useCallback(() => {
    const next = !is3d;
    setIs3d(next);
    if (next) {
      mapRef.current?.easeTo({ pitch: 60, bearing, duration: 800 });
    } else {
      if (compassEnabled) onToggleCompass?.();
      mapRef.current?.easeTo({ pitch: 0, bearing: 0, duration: 800 });
      setBearing(0);
      setPitch(0);
    }
  }, [is3d, bearing, compassEnabled, onToggleCompass]);

  // Bússola: ativar → vai para 3D + centraliza no usuário + inicia heading follow
  //          desativar → volta para 2D + reseta orientação ao norte
  const handleCompass = useCallback(() => {
    if (compassEnabled) {
      // Desativar bússola → voltar para 2D
      onToggleCompass?.();
      setIs3d(false);
      mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 500 });
      setBearing(0);
      setPitch(0);
    } else {
      // Ativar bússola → ir para 3D + centralizar no usuário
      onToggleCompass?.();
      setIs3d(true);
      const easeOpts: Parameters<MapRef['easeTo']>[0] = { pitch: 60, duration: 800 };
      if (localizacaoUsuario) {
        const [lat, lng] = localizacaoUsuario;
        easeOpts.center = [lng, lat];
        easeOpts.zoom = 17;
      }
      mapRef.current?.easeTo(easeOpts);
    }
  }, [compassEnabled, onToggleCompass, localizacaoUsuario]);

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

  // Ref para acessar paradaSelecionada no onLoad sem criar dependência circular
  const paradaSelecionadaRef = useRef(paradaSelecionada);
  useEffect(() => {
    paradaSelecionadaRef.current = paradaSelecionada;
  }, [paradaSelecionada]);

  // Centraliza na parada selecionada
  useEffect(() => {
    if (!paradaSelecionada) return;
    const [lat, lng] = paradaSelecionada.coordenadas;
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 17, duration: 800 });
  }, [paradaSelecionada]);

  // Quando o mapa termina de carregar (ex: após navegação da aba Próximos),
  // centraliza na parada selecionada caso já esteja definida no contexto.
  const handleMapLoad = useCallback(() => {
    const parada = paradaSelecionadaRef.current;
    if (!parada) return;
    const [lat, lng] = parada.coordenadas;
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 17, duration: 0 });
  }, []);

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

  // Linha travada pela sessão GPS ativa nunca muda com navegação, troca de
  // seleção na sidebar ou limpeza da seleção — só encerrando a sessão. Fora
  // de uma sessão ativa, a visualização normal usa a linha selecionada.
  const linhaGpsAtiva = rastreioColaborativo?.lockedLine ?? linhaSelecionada;

  return (
    <div className="relative h-full w-full">
      <MapPitchHint visible={true} />

      <MapLibreMap
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
        onLoad={handleMapLoad}
        onClick={handleMapClick}
      >
        <MapLibrePlannerOverlay />

        {isAuthenticated && rastreioColaborativo?.isActive && linhaGpsAtiva && (
          <MapLibreGpsRouteOverlay linha={linhaGpsAtiva} />
        )}

        <MapLibrePrediosLayer pitch={pitch} onPredioClicado={openPredio} />

        <MapLibreRotasLayer linha={linhaSelecionada} />

        <MapLibreParadasLayer
          paradas={todasParadas}
          paradaDestacadaId={paradaDestacadaId}
          onParadaClicada={openParada}
        />

        <MapLibreAllBusMarkers
          linhas={linhasAtivas}
          todasParadas={todasParadas}
          linhaNumeroExcluido={linhaGpsAtiva?.linha ?? null}
        />

        <MapLibreBhtransMarkers />

        {linhaGpsAtiva && (
          <MapLibreGpsLiveBusMarker
            key={linhaGpsAtiva.idRota}
            linha={linhaGpsAtiva}
            todasParadas={todasParadas}
          />
        )}

        {localizacaoUsuario && (
          <MapLibreUserMarker localizacao={localizacaoUsuario} heading={headingUsuario ?? null} />
        )}
      </MapLibreMap>

      {/* Controles de zoom e visão — lado esquerdo */}
      <div className="pointer-events-none absolute left-2 top-2 z-(--z-map-controls) flex flex-col items-center">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Aumentar zoom"
          title="Aumentar zoom"
          className={cn(
            'pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center bg-card text-text-primary hover:bg-card-hover',
            'rounded-t-sm border border-b-0 border-card-border shadow-sm transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
          )}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Diminuir zoom"
          title="Diminuir zoom"
          className={cn(
            'pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center bg-card text-text-primary hover:bg-card-hover',
            'rounded-b-sm border border-card-border shadow-sm transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
          )}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="my-1.5 h-px w-8 bg-card-border" />
        <button
          type="button"
          onClick={handleToggle3d}
          aria-pressed={is3d}
          aria-label={is3d ? 'Voltar à visão 2D' : 'Ativar visão 3D'}
          title={is3d ? 'Visão 2D' : 'Visão 3D'}
          className={cn(
            'pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center surface-card transition duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
            is3d || compassEnabled
              ? 'border-brand-primary bg-brand-primary/10 text-brand-primary dark:border-brand-accent dark:bg-brand-accent/10 dark:text-brand-accent'
              : 'bg-card text-text-primary hover:bg-card-hover',
          )}
        >
          <Box className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Card da parada — renderizado fora do <MapLibreMap> para não ser clipado */}
      {paradaAberta && (
        // biome-ignore lint/a11y/noStaticElementInteractions: clicar na área transparente ao redor do card fecha-o
        <div
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-(--z-sheet) flex justify-center"
          role="presentation"
          onClick={() => openParada(null)}
          onKeyDown={(e) => e.key === 'Escape' && openParada(null)}
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: bloqueia propagação para o wrapper externo que fecha o card */}
          <div
            className="w-full max-w-sm flex flex-col rounded-t-2xl bg-card shadow-[0_-4px_24px_rgba(0,0,0,0.18)] ring-1 ring-card-border"
            style={{ maxHeight: 'min(78vh, 560px)' }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {/* Header: handle centralizado + share + botão fechar */}
            <div className="relative flex items-center justify-center border-b border-card-border px-4 py-2.5">
              <button
                type="button"
                onClick={() => {
                  const text = paradaAberta.nome;
                  const url = buildParadaShareUrl(paradaAberta.idParada);
                  analytics.trackEvent({
                    category: 'engagement',
                    action: 'share_stop',
                    label: paradaAberta.nome,
                  });
                  if (navigator.share) {
                    void navigator.share({ title: text, text, url });
                  } else {
                    void navigator.clipboard?.writeText(url);
                  }
                }}
                aria-label={`Compartilhar parada ${paradaAberta.nome}`}
                className="absolute left-2 flex size-8 items-center justify-center rounded-full text-text-secondary hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <Share2 size={15} aria-hidden="true" />
              </button>
              <div className="h-1 w-10 rounded-full bg-card-border" aria-hidden="true" />
              <button
                type="button"
                onClick={() => openParada(null)}
                aria-label="Fechar card da parada"
                className="absolute right-2 flex size-8 items-center justify-center rounded-full text-text-secondary hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto">
              <ConteudoPopupParada parada={paradaAberta} onClose={() => openParada(null)} />
            </div>
          </div>
        </div>
      )}

      {/* Card do prédio — bottom sheet fora do <MapLibreMap> para não ser clipado */}
      {predioAberto && (
        // biome-ignore lint/a11y/noStaticElementInteractions: clicar na área transparente ao redor do card fecha-o
        <div
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-(--z-sheet) flex justify-center"
          role="presentation"
          onClick={() => openPredio(null)}
          onKeyDown={(e) => e.key === 'Escape' && openPredio(null)}
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: bloqueia propagação para o wrapper externo que fecha o card */}
          <div
            className="w-full max-w-sm flex flex-col rounded-t-2xl bg-card shadow-[0_-4px_24px_rgba(0,0,0,0.18)] ring-1 ring-card-border"
            style={{ maxHeight: 'min(72vh, 500px)' }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center border-b border-card-border px-4 py-2.5">
              <div className="h-1 w-10 rounded-full bg-card-border" aria-hidden="true" />
              <button
                type="button"
                onClick={() => openPredio(null)}
                aria-label="Fechar card do prédio"
                className="absolute right-2 flex size-8 items-center justify-center rounded-full text-text-secondary hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto">
              <CardPredio predio={predioAberto} onClose={() => openPredio(null)} />
            </div>
          </div>
        </div>
      )}

      {/* FABs — fora do <Map> mas dentro do container relativo */}
      <div className="pointer-events-none fixed bottom-24 right-4 z-(--z-map-controls) flex flex-col items-end gap-2 mb-[env(safe-area-inset-bottom)] md:bottom-6 md:mb-0">
        {onOpenSearch ? (
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Pesquisar paradas"
            title="Pesquisar paradas"
            className={cn(
              'pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center surface-card transition duration-200',
              'bg-card text-text-primary hover:bg-card-hover',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
            )}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
        {rastreioColaborativo && onAlternarRastreioColaborativo ? (
          <Tooltip
            position="left"
            content={
              rastreioAtivo
                ? 'Encerrar compartilhamento de posição com outros passageiros.'
                : 'Compartilha sua posição em tempo real para ajudar outros passageiros a saber quando o ônibus está próximo. Usa GPS continuamente enquanto ativo.'
            }
          >
            <button
              type="button"
              onClick={onAlternarRastreioColaborativo}
              aria-pressed={rastreioAtivo}
              title={
                rastreioAtivo
                  ? 'Encerrar compartilhamento de posição com outros passageiros.'
                  : 'Compartilhar sua posição para ajudar passageiros a saber quando o ônibus está próximo.'
              }
              aria-label={
                rastreioAtivo
                  ? `Encerrar ${rastreioColaborativo.label}. Status: ${statusRastreio}`
                  : `Iniciar ${rastreioColaborativo.label}`
              }
              className={cn(
                'pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center surface-card transition duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
                rastreioAtivo
                  ? 'border-success-border bg-success-solid text-white'
                  : 'bg-card text-text-primary hover:bg-card-hover',
              )}
            >
              {rastreioAtivo ? (
                <Square className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Radio className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </Tooltip>
        ) : null}

        <button
          type="button"
          onClick={handleCentroCampus}
          aria-label={`Centralizar mapa em ${CAMPUS_DISPLAY_NAME}`}
          title={`Centralizar mapa em ${CAMPUS_DISPLAY_NAME}`}
          className={cn(
            'pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center surface-card transition duration-200',
            'bg-card text-text-primary hover:bg-card-hover',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
          )}
        >
          <CornerUpLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Bússola: ativa → 3D + heading follow; desativa → volta 2D + norte */}
        <button
          type="button"
          onClick={handleCompass}
          aria-pressed={compassEnabled}
          aria-label={
            compassEnabled
              ? 'Desativar bússola e voltar para 2D'
              : 'Ativar bússola: muda para o mapa em 3D e gira conforme o dispositivo'
          }
          title={compassEnabled ? 'Desativar bússola' : 'Ativar bússola (3D)'}
          className={cn(
            'pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center surface-card transition duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
            compassEnabled
              ? 'border-brand-primary bg-brand-primary text-white'
              : isNorth
                ? 'bg-card text-text-secondary'
                : 'border-brand-primary bg-brand-primary/10 text-brand-primary dark:border-brand-accent dark:bg-brand-accent/10 dark:text-brand-accent',
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
            'pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center surface-card transition duration-200',
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
