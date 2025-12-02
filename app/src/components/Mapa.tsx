import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import React, {
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
  useMemo,
} from "react";
import { PopupCustomizado } from "./PopupCustomizado";
import { AntPathComponent } from "./AntPathComponent";
import { Parada, Linha } from "../types/data.types";

interface MapaProps {
  todasParadas: Parada[];
  linhaSelecionada: Linha | null;
  paradaSelecionada: Parada | null;
}

export interface MapaRef {
  centralizarParada: (parada: Parada) => void;
}

const stationIcon = L.icon({
  iconUrl: "./marker.svg",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const highlightedIcon = L.icon({
  iconUrl: "./marker.svg",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: "marker-highlighted",
});

// Componente para ajustar o mapa quando uma rota é selecionada
// Memoizado para evitar re-renderizações desnecessárias
const ChangeView = React.memo(
  ({ bounds }: { bounds: L.LatLngBounds | null }) => {
    const map = useMap();
    useEffect(() => {
      if (bounds) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [bounds, map]);
    return null;
  },
);

ChangeView.displayName = "ChangeView";

// Componente para centralizar em uma parada
const CenterOnParada = React.memo(({ parada }: { parada: Parada | null }) => {
  const map = useMap();
  useEffect(() => {
    if (parada && parada.coordenadas) {
      // Validação extra antes de tentar mover o mapa
      try {
        map.setView(parada.coordenadas, 17, { animate: true, duration: 1 });
      } catch (e) {
        console.error("Erro ao centralizar no mapa:", e);
      }
    }
  }, [parada, map]);
  return null;
});

CenterOnParada.displayName = "CenterOnParada";

// Componente de Marcador Memoizado para evitar re-renderização de TODOS os marcadores
// quando apenas UM muda de estado (destaque)
const MemoizedMarker = React.memo(
  ({
    parada,
    isDestacada,
    setMarkerRef,
  }: {
    parada: Parada;
    isDestacada: boolean;
    setMarkerRef: (id: string, ref: L.Marker | null) => void;
  }) => {
    return (
      <Marker
        position={parada.coordenadas}
        icon={isDestacada ? highlightedIcon : stationIcon}
        ref={(ref) => setMarkerRef(parada.idParada, ref)}
      >
        <PopupCustomizado parada={parada} />
      </Marker>
    );
  },
  (prev, next) => {
    // Custom comparison: re-render only if highlight state changes or coordinate changes (unlikely)
    return (
      prev.isDestacada === next.isDestacada &&
      prev.parada.idParada === next.parada.idParada
    );
  },
);

MemoizedMarker.displayName = "MemoizedMarker";

/**
 * Renderiza um mapa interativo com as paradas e rotas de ônibus.
 */
export const Mapa = forwardRef<MapaRef, MapaProps>(
  ({ todasParadas, linhaSelecionada, paradaSelecionada }, ref) => {
    const markersRef = useRef<{ [key: string]: L.Marker | null }>({});
    const [paradaDestacada, setParadaDestacada] = useState<string | null>(null);

    // Callback ref para gerenciar a lista de referências de marcadores de forma estável
    const handleSetMarkerRef = React.useCallback(
      (id: string, marker: L.Marker | null) => {
        if (marker) {
          markersRef.current[id] = marker;
        } else {
          delete markersRef.current[id];
        }
      },
      [],
    );

    useImperativeHandle(ref, () => ({
      centralizarParada: (parada: Parada) => {
        if (!parada || !parada.idParada) return;

        setParadaDestacada(parada.idParada);

        // Abrir popup do marcador
        const marker = markersRef.current[parada.idParada];
        if (marker) {
          marker.openPopup();
        }

        // Resetar destaque após 3 segundos
        setTimeout(() => {
          setParadaDestacada(null);
        }, 3000);
      },
    }));

    // Sempre exibir todas as paradas, independente da linha selecionada
    const paradasVisiveis = useMemo(() => {
      return todasParadas;
    }, [todasParadas]);

    // Calcular bounds baseado nas coordenadas do trajeto da linha
    const bounds = useMemo(() => {
      if (
        linhaSelecionada &&
        linhaSelecionada.coordenadasTrajeto &&
        linhaSelecionada.coordenadasTrajeto.length > 0
      ) {
        return L.latLngBounds(
          linhaSelecionada.coordenadasTrajeto as L.LatLngExpression[],
        );
      }
      return null;
    }, [linhaSelecionada]);

    // Otimização: AntPathComponent Props
    const antPathCoordinates = useMemo(
      () =>
        (linhaSelecionada?.coordenadasTrajeto as L.LatLngExpression[]) || [],
      [linhaSelecionada],
    );

    const antPathOptions = useMemo(
      () => ({
        delay: 600,
        dashArray: [20, 100],
        weight: 8,
        color: linhaSelecionada?.corHex || "#3388ff",
        pulseColor: linhaSelecionada?.corHex || "#3388ff",
        paused: false,
        reverse: false,
        hardwareAccelerated: true,
      }),
      [linhaSelecionada?.corHex],
    );

    return (
      <MapContainer
        center={[-19.87055, -43.96775]}
        zoom={15}
        className="h-full w-full"
        zoomControl={true}
        // Propriedade importante para evitar memory leaks em SPAs
        whenReady={() => {
          // Map is ready
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <ChangeView bounds={bounds} />
        <CenterOnParada parada={paradaSelecionada} />

        {/* Desenhar rota animada da linha selecionada com AntPath */}
        {linhaSelecionada && antPathCoordinates.length > 0 && (
          <AntPathComponent
            coordinates={antPathCoordinates}
            options={antPathOptions}
          />
        )}

        {/* Renderizar marcadores memoizados */}
        {paradasVisiveis.map((parada) => (
          <MemoizedMarker
            key={parada.idParada}
            parada={parada}
            isDestacada={paradaDestacada === parada.idParada}
            setMarkerRef={handleSetMarkerRef}
          />
        ))}
      </MapContainer>
    );
  },
);

Mapa.displayName = "Mapa";
