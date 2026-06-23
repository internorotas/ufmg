import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layer, Popup, Source, useMap } from 'react-map-gl/maplibre';
import { isLineAvailableToday } from '@/config/specialPeriods';
import { useRotasData, useRotasSelection } from '@/contexts/RotasContext';
import { calcularPrevisaoChegada } from '@/features/eta/domain/calculateEta';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { cn } from '@/lib/utils';
import type { Linha, Parada } from '@/types/data.types';
import type { MapLayerMouseEvent } from 'maplibre-gl';

interface ParadaClicada {
  parada: Parada;
  longitude: number;
  latitude: number;
}

interface MapLibreParadasLayerProps {
  paradas: Parada[];
  paradaDestacadaId: string | null;
}

export function MapLibreParadasLayer({ paradas, paradaDestacadaId }: MapLibreParadasLayerProps) {
  const { current: mapRef } = useMap();
  const [paradaClicada, setParadaClicada] = useState<ParadaClicada | null>(null);

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: paradas.map((p) => ({
        type: 'Feature' as const,
        properties: {
          id: p.idParada,
          nome: p.nome,
          destacada: p.idParada === paradaDestacadaId,
        },
        geometry: {
          type: 'Point' as const,
          // GeoJSON usa [longitude, latitude]
          coordinates: [p.coordenadas[1], p.coordenadas[0]],
        },
      })),
    }),
    [paradas, paradaDestacadaId],
  );

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const id = feature.properties?.id as string;
      const parada = paradas.find((p) => p.idParada === id);
      if (!parada) return;
      setParadaClicada({ parada, longitude: e.lngLat.lng, latitude: e.lngLat.lat });
    },
    [paradas],
  );

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    map.on('click', 'paradas-circle', handleClick);
    const onEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = '';
    };
    map.on('mouseenter', 'paradas-circle', onEnter);
    map.on('mouseleave', 'paradas-circle', onLeave);

    return () => {
      map.off('click', 'paradas-circle', handleClick);
      map.off('mouseenter', 'paradas-circle', onEnter);
      map.off('mouseleave', 'paradas-circle', onLeave);
    };
  }, [mapRef, handleClick]);

  return (
    <>
      <Source id="paradas" type="geojson" data={geojson}>
        <Layer
          id="paradas-circle"
          type="circle"
          paint={{
            'circle-radius': ['case', ['==', ['get', 'destacada'], true], 9, 6],
            'circle-color': ['case', ['==', ['get', 'destacada'], true], '#f59e0b', '#2563eb'],
            'circle-stroke-width': 2,
            'circle-stroke-color': 'white',
          }}
        />
      </Source>

      {paradaClicada && (
        <Popup
          longitude={paradaClicada.longitude}
          latitude={paradaClicada.latitude}
          onClose={() => setParadaClicada(null)}
          closeButton
          closeOnClick={false}
          maxWidth="280px"
          className="maplibre-parada-popup"
        >
          <ParadaMaplibreContent parada={paradaClicada.parada} />
        </Popup>
      )}
    </>
  );
}

function ParadaMaplibreContent({ parada }: { parada: Parada }) {
  const { rotasService } = useRotasData();
  const { selecionarLinha } = useRotasSelection();
  const currentTime = useCurrentTime();

  const linhasDisponiveis = useMemo(() => {
    const byNome = new Map<
      string,
      { linha: Linha; minutosFaltantes: number | null; horarioChegada: string }
    >();

    for (const nomeLinhaId of parada.linhasAtendidas ?? []) {
      const linha = rotasService.getLinhaById(nomeLinhaId);
      if (!linha || !isLineAvailableToday(linha.categoriaDia)) continue;

      const previsao = calcularPrevisaoChegada(linha, parada.idParada, currentTime);
      const minutos = previsao?.proximoOnibus?.minutosFaltantes ?? null;
      const horario = previsao?.proximoOnibus?.horarioChegada ?? '';

      const existing = byNome.get(linha.nome);
      if (!existing || (minutos !== null && (existing.minutosFaltantes === null || minutos < existing.minutosFaltantes))) {
        byNome.set(linha.nome, { linha, minutosFaltantes: minutos, horarioChegada: horario });
      }
    }

    return Array.from(byNome.values()).sort((a, b) => {
      if (a.minutosFaltantes === null && b.minutosFaltantes === null) return 0;
      if (a.minutosFaltantes === null) return 1;
      if (b.minutosFaltantes === null) return -1;
      return a.minutosFaltantes - b.minutosFaltantes;
    });
  }, [parada.idParada, parada.linhasAtendidas, rotasService, currentTime]);

  return (
    <div className="flex w-[min(15rem,72vw)] flex-col gap-2 p-1 text-text-primary">
      <div className="flex items-start gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white">
          <span className="text-xs font-bold">P</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-snug">{parada.nome}</p>
          {parada.categoria ? (
            <p className="text-xs text-text-secondary">{parada.categoria}</p>
          ) : null}
        </div>
      </div>

      {linhasDisponiveis.length > 0 && (
        <div className="border-t border-card-border pt-2">
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {linhasDisponiveis.map(({ linha, minutosFaltantes }) => (
              <li
                key={linha.idRota}
                className="rounded border border-card-border bg-card p-1.5"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-1.5 text-left text-xs font-semibold text-text-primary hover:text-brand-primary focus-visible:outline-none"
                  onClick={() => selecionarLinha(linha)}
                >
                  <span
                    className="inline-block h-3 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: linha.corHex }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{linha.nome}</span>
                  {minutosFaltantes !== null && (
                    <span
                      className={cn(
                        'ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white',
                        minutosFaltantes <= 5
                          ? 'bg-success-border'
                          : minutosFaltantes <= 15
                            ? 'bg-warning-border'
                            : 'bg-text-secondary',
                      )}
                    >
                      {minutosFaltantes}min
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
