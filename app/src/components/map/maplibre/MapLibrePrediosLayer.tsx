import type { MapLayerMouseEvent } from 'maplibre-gl';
import React, { useCallback, useEffect } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';
import { useUfmPrediosQuery } from '@/features/transit-data/queries/useUfmPrediosQuery';

const MIN_ZOOM = 14;
const PITCH_EXTRUDE_THRESHOLD = 20;

const LAYER_IDS = ['predios-3d', 'predios-flat', 'predios-flat-outline'] as const;

export interface PredioInfo {
  id: string | number;
  nome: string;
  amenity?: string;
  description?: string;
  bannerUrl?: string;
  longitude: number;
  latitude: number;
}

// Mapeamento OSM amenity → rótulo em português + categoria visual
const AMENITY_LABELS: Record<string, { label: string; cor: string }> = {
  restaurant: { label: 'Restaurante', cor: 'bg-orange-100 text-orange-700' },
  library: { label: 'Biblioteca', cor: 'bg-blue-100 text-blue-700' },
  school: { label: 'Escola / Colégio', cor: 'bg-purple-100 text-purple-700' },
  university: { label: 'Universidade', cor: 'bg-indigo-100 text-indigo-700' },
  clinic: { label: 'Clínica', cor: 'bg-red-100 text-red-700' },
  hospital: { label: 'Hospital', cor: 'bg-red-100 text-red-700' },
  veterinary: { label: 'Veterinário', cor: 'bg-green-100 text-green-700' },
  pharmacy: { label: 'Farmácia', cor: 'bg-green-100 text-green-700' },
  theatre: { label: 'Teatro', cor: 'bg-pink-100 text-pink-700' },
  arts_centre: { label: 'Centro Cultural', cor: 'bg-pink-100 text-pink-700' },
  cinema: { label: 'Cinema', cor: 'bg-pink-100 text-pink-700' },
  gymnasium: { label: 'Ginásio', cor: 'bg-yellow-100 text-yellow-700' },
  sports_centre: { label: 'Centro Esportivo', cor: 'bg-yellow-100 text-yellow-700' },
  bank: { label: 'Banco', cor: 'bg-slate-100 text-slate-700' },
  atm: { label: 'Caixa Eletrônico', cor: 'bg-slate-100 text-slate-700' },
  post_office: { label: 'Correios', cor: 'bg-yellow-100 text-yellow-700' },
  place_of_worship: { label: 'Local de Culto', cor: 'bg-amber-100 text-amber-700' },
  parking: { label: 'Estacionamento', cor: 'bg-slate-100 text-slate-700' },
  toilets: { label: 'Banheiros', cor: 'bg-slate-100 text-slate-700' },
  drinking_water: { label: 'Água Potável', cor: 'bg-cyan-100 text-cyan-700' },
  food_court: { label: 'Praça de Alimentação', cor: 'bg-orange-100 text-orange-700' },
  conference_centre: { label: 'Centro de Conferências', cor: 'bg-indigo-100 text-indigo-700' },
  research_institute: { label: 'Instituto de Pesquisa', cor: 'bg-indigo-100 text-indigo-700' },
};

function formatarAmenity(amenity: string): { label: string; cor: string } {
  const mapeado = AMENITY_LABELS[amenity];
  if (mapeado) return mapeado;
  return {
    label: amenity.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    cor: 'bg-slate-100 text-slate-700',
  };
}

interface MapLibrePrediosLayerProps {
  pitch: number;
  onPredioClicado?: (predio: PredioInfo) => void;
}

export const MapLibrePrediosLayer = React.memo(function MapLibrePrediosLayer({
  pitch,
  onPredioClicado,
}: MapLibrePrediosLayerProps) {
  const { current: mapRef } = useMap();
  const { data: prediosData } = useUfmPrediosQuery();

  const extruding = pitch >= PITCH_EXTRUDE_THRESHOLD;

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const nome = feature.properties?.name as string | undefined;
      if (!nome) return;
      const info: PredioInfo = {
        id: (feature.properties?.id as string | number | undefined) ?? 0,
        nome,
        amenity: feature.properties?.amenity as string | undefined,
        description: feature.properties?.description as string | undefined,
        bannerUrl: feature.properties?.banner_url as string | undefined,
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
      };
      // preventDefault() sinaliza para handleMapClick que esse click já foi tratado
      // (MapLibre dispara o evento de layer E o evento global do mapa para o mesmo click).
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      onPredioClicado?.(info);
    },
    [onPredioClicado],
  );

  // Registra handlers de click/cursor nas layers
  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const onEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    LAYER_IDS.forEach((id) => {
      map.on('click', id, handleClick);
      map.on('mouseenter', id, onEnter);
      map.on('mouseleave', id, onLeave);
    });

    return () => {
      LAYER_IDS.forEach((id) => {
        map.off('click', id, handleClick);
        map.off('mouseenter', id, onEnter);
        map.off('mouseleave', id, onLeave);
      });
    };
  }, [mapRef, handleClick]);

  // Atualiza visibilidade diretamente via API do MapLibre (garantia além do layout prop)
  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    try {
      if (map.getLayer('predios-3d')) {
        map.setLayoutProperty('predios-3d', 'visibility', extruding ? 'visible' : 'none');
      }
      if (map.getLayer('predios-flat')) {
        map.setLayoutProperty('predios-flat', 'visibility', extruding ? 'none' : 'visible');
      }
      if (map.getLayer('predios-flat-outline')) {
        map.setLayoutProperty('predios-flat-outline', 'visibility', extruding ? 'none' : 'visible');
      }
    } catch {
      // layers ainda não prontas — o layout prop declarativo já cuida disso
    }
  }, [mapRef, extruding]);

  if (!prediosData) return null;

  return (
    // biome-ignore lint/suspicious/noExplicitAny: GeoJSON type incompatibility
    <Source id="predios" type="geojson" data={prediosData as any}>
      {/* Modo 3D: fill-extrusion */}
      <Layer
        id="predios-3d"
        type="fill-extrusion"
        minzoom={MIN_ZOOM}
        layout={{ visibility: extruding ? 'visible' : 'none' }}
        paint={{
          'fill-extrusion-color': '#4a90d9',
          'fill-extrusion-height': 18,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.75,
        }}
      />

      {/* Modo 2D: fill com cor mais saturada para indicar interatividade */}
      <Layer
        id="predios-flat"
        type="fill"
        minzoom={MIN_ZOOM}
        layout={{ visibility: extruding ? 'none' : 'visible' }}
        paint={{
          'fill-color': [
            'case',
            ['!=', ['get', 'amenity'], null],
            '#3b82f6', // amenity: azul mais intenso
            '#60a5fa', // sem amenity: azul padrão
          ],
          'fill-opacity': 0.28,
        }}
      />

      {/* Borda sólida no modo 2D — torna o prédio claramente distinto e clicável */}
      <Layer
        id="predios-flat-outline"
        type="line"
        minzoom={MIN_ZOOM}
        layout={{ visibility: extruding ? 'none' : 'visible' }}
        paint={{
          'line-color': '#2563eb',
          'line-width': 1.5,
          'line-opacity': 0.7,
        }}
      />
    </Source>
  );
});

interface CardPredioProps {
  predio: PredioInfo;
  onClose: () => void;
}

export function CardPredio({ predio, onClose: _onClose }: CardPredioProps) {
  const amenityInfo = predio.amenity ? formatarAmenity(predio.amenity) : null;

  return (
    <section
      aria-label={`Informações sobre ${predio.nome}`}
      className="flex flex-col gap-3 text-text-primary"
    >
      {/* Banner */}
      {predio.bannerUrl && (
        <div className="overflow-hidden rounded-t-2xl" style={{ maxHeight: 160 }}>
          <img
            src={predio.bannerUrl}
            alt={`Banner de ${predio.nome}`}
            className="w-full object-cover"
            style={{ maxHeight: 160 }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 p-4 pt-3">
        {/* Header */}
        <header className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary shadow-sm dark:bg-brand-accent/15 dark:text-brand-accent"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <path d="M9 22v-4h6v4" />
              <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01M12 14h.01" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold leading-snug text-text-primary">{predio.nome}</h3>
            {amenityInfo && (
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${amenityInfo.cor}`}
              >
                {amenityInfo.label}
              </span>
            )}
          </div>
        </header>

        {predio.description && (
          <p className="text-xs leading-relaxed text-text-secondary">{predio.description}</p>
        )}
      </div>
    </section>
  );
}
