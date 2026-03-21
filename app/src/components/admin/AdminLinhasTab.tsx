import { useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type DragEndEvent } from 'leaflet';
import icon from '../../assets/marker.svg';
import type { CategoriaLinhas, Linha, Parada } from '../../types/data.types';

const stationIcon = L.icon({
  iconUrl: icon,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// Create a small custom icon for vertices
const vertexIcon = L.divIcon({
  className: 'custom-vertex-icon',
  html: '<div style="width:10px;height:10px;background:white;border:2px solid black;border-radius:50%"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function RouteEditorEvents({
  enabled,
  onAddPoint,
}: {
  enabled: boolean;
  onAddPoint: (latlng: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (enabled) {
        onAddPoint([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

export function AdminLinhasTab({
  linhasData,
  setLinhasData,
  paradas,
  setActiveTab,
  onExport,
}: {
  linhasData: CategoriaLinhas;
  setLinhasData: (l: CategoriaLinhas) => void;
  paradas: Parada[];
  setActiveTab: (tab: 'paradas' | 'linhas') => void;
  onExport: () => void;
}) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [itinerarioDrafts, setItinerarioDrafts] = useState<Record<string, string>>({});
  const [horariosDrafts, setHorariosDrafts] = useState<Record<string, string>>({});

  // Helper flatten to get the active line
  const activeCategory = linhasData.categoriasDias[activeCategoryIdx];
  const selectedLinha = activeCategory?.linhas.find((l) => l.idRota === selectedRouteId) || null;
  const selectedLinhaKey = selectedLinha ? `${activeCategoryIdx}-${selectedLinha.idRota}` : null;
  const uniqueParadas = useMemo(() => {
    const byId = new Map<string, Parada>();
    for (const parada of paradas) {
      if (!byId.has(parada.idParada)) {
        byId.set(parada.idParada, parada);
      }
    }
    return Array.from(byId.values());
  }, [paradas]);

  const itinerarioInput = selectedLinhaKey
    ? (itinerarioDrafts[selectedLinhaKey] ?? selectedLinha?.itinerarioParadasIds.join(', ') ?? '')
    : '';
  const horariosInput = selectedLinhaKey
    ? (horariosDrafts[selectedLinhaKey] ?? JSON.stringify(selectedLinha?.horarios ?? [], null, 2))
    : '[]';

  const handleUpdateLinha = (updated: Linha) => {
    const newCategories = [...linhasData.categoriasDias];
    newCategories[activeCategoryIdx] = {
      ...newCategories[activeCategoryIdx],
      linhas: newCategories[activeCategoryIdx].linhas.map((l) =>
        l.idRota === updated.idRota ? updated : l,
      ),
    };
    setLinhasData({ categoriasDias: newCategories });
  };

  const handleDragVertex = (idx: number, e: DragEndEvent) => {
    if (!selectedLinha) return;
    const latlng = e.target.getLatLng();
    const newCoords = [...selectedLinha.coordenadasTrajeto];
    newCoords[idx] = [latlng.lat, latlng.lng];
    handleUpdateLinha({ ...selectedLinha, coordenadasTrajeto: newCoords });
  };

  const handleDeleteVertex = (idx: number) => {
    if (!selectedLinha) return;
    const newCoords = selectedLinha.coordenadasTrajeto.filter((_, i) => i !== idx);
    handleUpdateLinha({ ...selectedLinha, coordenadasTrajeto: newCoords });
  };

  const handleAddPoint = (point: [number, number]) => {
    if (!selectedLinha) return;
    handleUpdateLinha({
      ...selectedLinha,
      coordenadasTrajeto: [...selectedLinha.coordenadasTrajeto, point],
    });
  };

  return (
    <>
      <div className="w-96 flex flex-col bg-sidebar shadow-lg z-1000 h-full overflow-hidden border-r border-card-border">
        {/* Header Options */}
        <div className="p-4 border-b border-card-border flex justify-between items-center bg-card">
          <h1 className="text-xl font-bold text-text-primary">Admin Panel</h1>
          <button
            type="button"
            onClick={onExport}
            className="px-4 py-2 bg-brand-primary text-text-inverse rounded hover:opacity-90 text-sm font-medium"
          >
            Export All
          </button>
        </div>

        {/* Tabs inside sidebar */}
        <div className="flex border-b border-card-border bg-card">
          <button
            type="button"
            className={`flex-1 py-3 text-center font-medium text-text-secondary hover:text-text-primary`}
            onClick={() => setActiveTab('paradas')}
          >
            Paradas
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-center font-medium border-b-2 border-brand-primary text-brand-primary`}
            onClick={() => setActiveTab('linhas')}
          >
            Linhas
          </button>
        </div>

        <div className="p-4 border-b border-card-border">
          <label
            htmlFor="admin-linhas-categoria"
            className="block text-sm font-bold text-text-primary mb-1"
          >
            Categoria (Dia)
          </label>
          <select
            id="admin-linhas-categoria"
            value={activeCategoryIdx}
            onChange={(e) => {
              setActiveCategoryIdx(Number(e.target.value));
              setSelectedRouteId(null);
            }}
            className="w-full h-11 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
          >
            {linhasData.categoriasDias.map((cat, idx) => (
              <option key={cat.id} value={idx}>
                {cat.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 border-b border-card-border">
          <label
            htmlFor="admin-linhas-rota"
            className="block text-sm font-bold text-text-primary mb-1"
          >
            Selecionar Linha
          </label>
          <select
            id="admin-linhas-rota"
            value={selectedRouteId || ''}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="w-full h-11 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
          >
            <option value="">-- Selecione --</option>
            {activeCategory?.linhas.map((l) => (
              <option key={l.idRota} value={l.idRota}>
                {l.nome} ({l.linha})
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 flex-1 overflow-y-auto w-full bg-sidebar">
          {!selectedLinha ? (
            <p className="text-text-secondary text-sm">
              Selecione uma linha para editar seu trajeto, dados e horários.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg text-text-primary">
                  Editando {selectedLinha.nome}
                </span>
                <button
                  type="button"
                  onClick={() => setDrawMode(!drawMode)}
                  className={`px-3 py-1 rounded text-sm font-medium ${drawMode ? 'bg-warning-bg text-warning-text border border-warning-border' : 'bg-info-bg text-info-text border border-info-border'}`}
                >
                  {drawMode ? 'Parar Desenho' : 'Desenhar Rota'}
                </button>
              </div>

              <div>
                <label
                  htmlFor="admin-linhas-id-rota"
                  className="block text-sm font-bold text-text-primary mb-1"
                >
                  ID da Rota
                </label>
                <input
                  id="admin-linhas-id-rota"
                  type="text"
                  value={selectedLinha.idRota}
                  onChange={(e) =>
                    handleUpdateLinha({
                      ...selectedLinha,
                      idRota: e.target.value,
                    })
                  }
                  className="w-full h-11 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label
                    htmlFor="admin-linhas-numero"
                    className="block text-sm font-bold text-text-primary mb-1"
                  >
                    Número
                  </label>
                  <input
                    id="admin-linhas-numero"
                    type="number"
                    value={selectedLinha.linha}
                    onChange={(e) =>
                      handleUpdateLinha({
                        ...selectedLinha,
                        linha: Number(e.target.value),
                      })
                    }
                    className="w-full h-11 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="admin-linhas-cor"
                    className="block text-sm font-bold text-text-primary mb-1"
                  >
                    Cor Hex
                  </label>
                  <input
                    id="admin-linhas-cor"
                    type="text"
                    value={selectedLinha.corHex}
                    onChange={(e) =>
                      handleUpdateLinha({
                        ...selectedLinha,
                        corHex: e.target.value,
                      })
                    }
                    className="w-full h-11 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-linhas-nome"
                  className="block text-sm font-bold text-text-primary mb-1"
                >
                  Nome
                </label>
                <input
                  id="admin-linhas-nome"
                  type="text"
                  value={selectedLinha.nome}
                  onChange={(e) =>
                    handleUpdateLinha({
                      ...selectedLinha,
                      nome: e.target.value,
                    })
                  }
                  className="w-full h-11 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-linhas-itinerario"
                  className="block text-sm font-bold text-text-primary mb-1"
                >
                  IDs das Paradas (Ordenadas por vírgula)
                </label>
                <textarea
                  id="admin-linhas-itinerario"
                  rows={6}
                  value={itinerarioInput}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (selectedLinhaKey) {
                      setItinerarioDrafts((prev) => ({
                        ...prev,
                        [selectedLinhaKey]: text,
                      }));
                    }
                    const parsed = text
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    handleUpdateLinha({
                      ...selectedLinha,
                      itinerarioParadasIds: parsed,
                    });
                  }}
                  className="w-full min-h-32 border border-input-border bg-input text-text-primary p-3 rounded text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-linhas-horarios"
                  className="block text-sm font-bold text-text-primary mb-1"
                >
                  Horários (JSON Array)
                </label>
                <textarea
                  id="admin-linhas-horarios"
                  rows={8}
                  value={horariosInput}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (selectedLinhaKey) {
                      setHorariosDrafts((prev) => ({
                        ...prev,
                        [selectedLinhaKey]: text,
                      }));
                    }
                    try {
                      const val = JSON.parse(text);
                      if (Array.isArray(val)) {
                        handleUpdateLinha({ ...selectedLinha, horarios: val });
                      }
                    } catch {
                      // ignore parse errors while typing
                    }
                  }}
                  className="w-full min-h-44 border border-input-border bg-input text-text-primary p-3 rounded text-sm font-mono"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer center={[-19.87055, -43.96775]} zoom={15} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RouteEditorEvents enabled={drawMode} onAddPoint={handleAddPoint} />

          {/* Render all paradas so you can see them while drawing routes */}
          {uniqueParadas.map((p) => (
            <Marker key={p.idParada} position={p.coordenadas} icon={stationIcon}>
              <Popup>
                {p.nome} ({p.idParada})
              </Popup>
            </Marker>
          ))}

          {selectedLinha && (
            <>
              <Polyline
                positions={selectedLinha.coordenadasTrajeto}
                pathOptions={{ color: selectedLinha.corHex, weight: 4 }}
              />
              {selectedLinha.coordenadasTrajeto.map((coord, idx) => (
                <Marker
                  key={`coord-${coord[0]}-${coord[1]}`}
                  position={coord}
                  icon={vertexIcon}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => handleDragVertex(idx, e),
                    click: () => handleDeleteVertex(idx),
                  }}
                >
                  <Popup>Vértice {idx}. Clique para excluir.</Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>
      </div>
    </>
  );
}
