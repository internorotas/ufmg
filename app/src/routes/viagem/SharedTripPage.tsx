import 'maplibre-gl/dist/maplibre-gl.css';
import { Loader2, MapPin, Radio } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import MapLibreMap, { Layer, type MapRef, Marker, Source } from 'react-map-gl/maplibre';
import { useParams } from 'react-router-dom';
import { RotasDataProvider, useRotasData } from '@/contexts/RotasDataContext';
import {
  getSharedTrip,
  type SharedTripLastPosition,
  type SharedTripStatus,
} from '@/features/gps/api/gpsClient';
import { COORDENADAS_CAMPUS } from '@/hooks/useLocalizacaoUsuario';

const POLL_INTERVAL_MS = 5_000;
const ACTIVE_POLL_STATUSES: readonly SharedTripStatus[] = [
  'active',
  'waiting_for_position',
  'stale',
];

const STATUS_MESSAGES: Record<SharedTripStatus, string> = {
  waiting_for_position: 'A viagem foi compartilhada, aguardando a primeira posição.',
  active: 'Localização ao vivo.',
  stale: 'A posição não é atualizada há alguns minutos.',
  finished: 'A viagem foi encerrada.',
  expired: 'Este link expirou.',
  revoked: 'O compartilhamento foi encerrado.',
  not_found: 'Este link não existe ou não está mais disponível.',
};

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function SharedTripMap({
  coordenadasTrajeto,
  corHex,
  lastPosition,
}: {
  coordenadasTrajeto: [number, number][];
  corHex: string;
  lastPosition: SharedTripLastPosition | null;
}) {
  const mapRef = useRef<MapRef>(null);
  const hasCenteredRef = useRef(false);

  // Centraliza no marcador só na PRIMEIRA posição recebida — atualizações
  // seguintes nunca recentralizam à força (o usuário pode ter dado pan/zoom).
  useEffect(() => {
    if (!lastPosition || hasCenteredRef.current) return;
    hasCenteredRef.current = true;
    mapRef.current?.flyTo({
      center: [lastPosition.lng, lastPosition.lat],
      zoom: 15,
      duration: 800,
    });
  }, [lastPosition]);

  const lineGeoJson = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: coordenadasTrajeto.map(([lat, lng]) => [lng, lat]),
      },
    }),
    [coordenadasTrajeto],
  );

  const initialCenter = lastPosition
    ? { longitude: lastPosition.lng, latitude: lastPosition.lat }
    : { longitude: COORDENADAS_CAMPUS[1], latitude: COORDENADAS_CAMPUS[0] };

  return (
    <MapLibreMap
      ref={mapRef}
      initialViewState={{ ...initialCenter, zoom: 14 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={{
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'raster-tiles', type: 'raster', source: 'raster-tiles' }],
      }}
    >
      {coordenadasTrajeto.length >= 2 && (
        <Source id="shared-trip-line" type="geojson" data={lineGeoJson}>
          <Layer
            id="shared-trip-line-layer"
            type="line"
            paint={{ 'line-color': corHex, 'line-width': 4, 'line-opacity': 0.85 }}
          />
        </Source>
      )}

      {lastPosition && (
        <Marker longitude={lastPosition.lng} latitude={lastPosition.lat} anchor="center">
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: corHex,
              border: '3px solid white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
              transform:
                lastPosition.heading != null ? `rotate(${lastPosition.heading}deg)` : undefined,
            }}
          />
        </Marker>
      )}
    </MapLibreMap>
  );
}

function SharedTripPageContent({ token }: { token: string }) {
  const { linhasData, todasParadas: _todasParadas, isLoadingData } = useRotasData();
  const [status, setStatus] = useState<SharedTripStatus>('waiting_for_position');
  const [linhaId, setLinhaId] = useState<string | null>(null);
  const [lastPosition, setLastPosition] = useState<SharedTripLastPosition | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll(): Promise<void> {
      const trip = await getSharedTrip(token);
      if (cancelled) return;

      setStatus(trip.status);
      if (trip.linhaId) setLinhaId(trip.linhaId);
      setLastPosition(trip.lastPosition ?? null);

      if (ACTIVE_POLL_STATUSES.includes(trip.status)) {
        timer = setTimeout(() => void poll(), POLL_INTERVAL_MS);
      }
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  const linha = useMemo(() => {
    if (!linhaId) return null;
    return (
      linhasData.categoriasDias
        .flatMap((categoria) => categoria.linhas)
        .find((l) => l.idRota === linhaId) ?? null
    );
  }, [linhasData, linhaId]);

  const isLive = status === 'active';
  const statusMessage = STATUS_MESSAGES[status];

  return (
    <div className="relative flex h-dvh w-full flex-col bg-background">
      <header className="surface-card z-(--z-map-decor) flex items-center gap-2 bg-card px-4 py-3">
        <Radio
          size={16}
          aria-hidden="true"
          className={isLive ? 'text-danger-solid' : 'text-text-secondary'}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-text-primary">
            {linha ? linha.nome : 'Viagem compartilhada'}
          </p>
          <p role="status" aria-live="polite" className="truncate text-xs text-text-secondary">
            {statusMessage}
            {lastPosition && (status === 'active' || status === 'stale') && (
              <> · atualizado às {formatUpdatedAt(lastPosition.updatedAt)}</>
            )}
          </p>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {isLoadingData ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="animate-spin text-brand-primary" size={32} aria-hidden="true" />
          </div>
        ) : (
          <SharedTripMap
            coordenadasTrajeto={linha?.coordenadasTrajeto ?? []}
            corHex={linha?.corHex ?? '#2c0eeb'}
            lastPosition={lastPosition}
          />
        )}

        {(status === 'finished' ||
          status === 'expired' ||
          status === 'revoked' ||
          status === 'not_found') && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 p-6">
            <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-2 rounded-xl bg-card px-6 py-5 text-center shadow-lg">
              <MapPin size={24} aria-hidden="true" className="text-text-secondary" />
              <p className="text-sm font-semibold text-text-primary">{statusMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SharedTripPage() {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background p-6 text-center">
        <p className="text-sm text-text-secondary">{STATUS_MESSAGES.not_found}</p>
      </div>
    );
  }

  return (
    <RotasDataProvider>
      <SharedTripPageContent token={token} />
    </RotasDataProvider>
  );
}
