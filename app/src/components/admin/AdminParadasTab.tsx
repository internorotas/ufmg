import { useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L, { DragEndEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Parada, CategoriaLinhas } from "../../types/data.types";

import icon from "../../assets/marker.svg";

const stationIcon = L.icon({
  iconUrl: icon,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const highlightedIcon = L.icon({
  iconUrl: icon,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: "marker-highlighted",
});

export function AdminParadasTab({
  paradas,
  setParadas,
  linhasData,
  setActiveTab,
  onExport,
}: {
  paradas: Parada[];
  setParadas: (p: Parada[]) => void;
  linhasData: CategoriaLinhas;
  setActiveTab: (tab: "paradas" | "linhas") => void;
  onExport: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const uniqueParadas = useMemo(() => {
    const byId = new Map<string, Parada>();
    for (const parada of paradas) {
      if (!byId.has(parada.idParada)) {
        byId.set(parada.idParada, parada);
      }
    }
    return Array.from(byId.values());
  }, [paradas]);

  const selectedParada = paradas.find((p) => p.idParada === selectedId) || null;

  const handleDragEnd = (id: string, e: DragEndEvent) => {
    const latLng = e.target.getLatLng();
    setParadas(
      paradas.map((p) =>
        p.idParada === id ? { ...p, coordenadas: [latLng.lat, latLng.lng] } : p,
      ),
    );
  };

  const handleUpdate = (updated: Parada) => {
    setParadas(
      paradas.map((p) => (p.idParada === updated.idParada ? updated : p)),
    );
  };

  const handleAdd = () => {
    const newId = `p_new_${Date.now()}`;
    const newParada: Parada = {
      idParada: newId,
      nome: "Nova Parada",
      linhasAtendidas: [],
      categoria: "padrao",
      descricao: "",
      coordenadas: [-19.869, -43.966], // default UFMG center
    };
    setParadas([...paradas, newParada]);
    setSelectedId(newId);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setParadas(paradas.filter((p) => p.idParada !== selectedId));
    setSelectedId(null);
  };

  return (
    <>
      <div className="w-96 flex flex-col bg-sidebar shadow-lg z-[1000] h-full overflow-hidden border-r border-card-border">
        {/* Header Options */}
        <div className="p-4 border-b border-card-border flex justify-between items-center bg-card">
          <h1 className="text-xl font-bold text-text-primary">Admin Panel</h1>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-brand-primary text-text-inverse rounded hover:opacity-90 text-sm font-medium"
          >
            Export All
          </button>
        </div>

        {/* Tabs inside sidebar */}
        <div className="flex border-b border-card-border bg-card">
          <button
            className={`flex-1 py-3 text-center font-medium border-b-2 border-brand-primary text-brand-primary`}
            onClick={() => setActiveTab("paradas")}
          >
            Paradas
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium text-text-secondary hover:text-text-primary`}
            onClick={() => setActiveTab("linhas")}
          >
            Linhas
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto w-full bg-sidebar">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-text-primary">
              Gerenciar Paradas
            </h2>
            <button
              onClick={handleAdd}
              className="bg-success-bg border border-success-border text-success-text px-3 py-1 rounded text-sm hover:opacity-90"
            >
              + Adicionar
            </button>
          </div>

          {!selectedParada ? (
            <p className="text-text-secondary text-sm">
              Selecione uma parada no mapa ou crie uma nova.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">
                  ID (Obrigatório)
                </label>
                <input
                  type="text"
                  value={selectedParada.idParada}
                  onChange={(e) =>
                    handleUpdate({
                      ...selectedParada,
                      idParada: e.target.value,
                    })
                  }
                  className="w-full h-11 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={selectedParada.nome}
                  onChange={(e) =>
                    handleUpdate({ ...selectedParada, nome: e.target.value })
                  }
                  className="w-full h-11 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={selectedParada.descricao || ""}
                  onChange={(e) =>
                    handleUpdate({
                      ...selectedParada,
                      descricao: e.target.value,
                    })
                  }
                  className="w-full h-11 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">
                  Linhas (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={selectedParada.linhasAtendidas.join(", ")}
                  onChange={(e) =>
                    handleUpdate({
                      ...selectedParada,
                      linhasAtendidas: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full h-11 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
                />
              </div>

              <div className="mt-4 pt-4 border-t border-card-border">
                <button
                  onClick={handleDelete}
                  className="w-full bg-warning-bg border border-warning-border text-warning-text py-2 rounded text-sm font-bold hover:opacity-90"
                >
                  Excluir Parada
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={[-19.87055, -43.96775]}
          zoom={15}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {uniqueParadas.map((p) => (
            <Marker
              key={p.idParada}
              position={p.coordenadas}
              icon={p.idParada === selectedId ? highlightedIcon : stationIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => handleDragEnd(p.idParada, e),
                click: () => setSelectedId(p.idParada),
              }}
            >
              <Popup>
                {p.nome} ({p.idParada})
              </Popup>
            </Marker>
          ))}
          {linhasData.categoriasDias
            .flatMap((cd, categoryIdx) =>
              cd.linhas.map((linha) => ({ linha, categoryIdx })),
            )
            .map(
              ({ linha, categoryIdx }) =>
                linha.coordenadasTrajeto.length > 0 && (
                  <Polyline
                    key={`${categoryIdx}-${linha.idRota}`}
                    positions={linha.coordenadasTrajeto}
                    pathOptions={{
                      color: linha.corHex,
                      weight: 3,
                      opacity: 0.5,
                      dashArray: "5, 5",
                    }}
                  />
                ),
            )}
        </MapContainer>
      </div>
    </>
  );
}
