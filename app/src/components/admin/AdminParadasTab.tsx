import L, { type DragEndEvent } from 'leaflet';
import { MousePointerClick } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import icon from '../../assets/marker.svg';
import { DEFAULT_MAP_CENTER } from '../../config/mapDefaults';
import type { CategoriaLinhas, Linha, Parada } from '../../types/data.types';

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
  className: 'marker-highlighted',
});

const CATEGORIA_OPTIONS = [
  'Ponto de Origem/Destino',
  'Parada Regular',
  'Terminal',
  'Externo',
  'Especial',
];

/** Picker multi-seleção de linhas para "Linhas Atendidas" */
function LinhasMultiPicker({
  linhasData,
  selected,
  onChange,
}: {
  linhasData: CategoriaLinhas;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const todasLinhas = useMemo(() => {
    const byId = new Map<string, Linha>();
    for (const cat of linhasData.categoriasDias) {
      for (const l of cat.linhas) {
        if (!byId.has(l.idRota)) byId.set(l.idRota, l);
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [linhasData]);

  const filtered = search.trim()
    ? todasLinhas.filter(
        (l) =>
          l.nome.toLowerCase().includes(search.toLowerCase()) ||
          l.idRota.toLowerCase().includes(search.toLowerCase()),
      )
    : todasLinhas;

  const toggle = (idRota: string) => {
    onChange(
      selected.includes(idRota) ? selected.filter((id) => id !== idRota) : [...selected, idRota],
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-9 flex items-center justify-between gap-2 border border-input-border bg-input text-text-primary px-3 rounded text-sm hover:bg-card-hover transition-colors"
      >
        <span className="truncate">
          {selected.length === 0
            ? 'Nenhuma linha vinculada'
            : `${selected.length} linha(s) vinculada(s)`}
        </span>
        <span className="text-text-secondary text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map((idRota) => {
            const l = todasLinhas.find((x) => x.idRota === idRota);
            return (
              <span
                key={idRota}
                className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border border-card-border bg-background-secondary"
              >
                {l && (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: l.corHex }}
                  />
                )}
                <span className="font-mono">{l ? `${l.linha}. ${l.nome}` : idRota}</span>
                <button
                  type="button"
                  onClick={() => toggle(idRota)}
                  className="text-text-secondary hover:text-text-primary leading-none"
                  aria-label={`Remover ${idRota}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {open && (
        <div className="absolute z-9999 top-full left-0 right-0 mt-1 bg-card border border-card-border rounded shadow-lg max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-card-border shrink-0">
            <input
              type="search"
              placeholder="Buscar linha..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 border border-input-border bg-input text-text-primary px-2 rounded text-xs"
              // biome-ignore lint/a11y/noAutofocus: campo de busca do picker precisa foco ao abrir
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="p-3 text-xs text-text-secondary">Nenhuma linha encontrada.</p>
            ) : (
              filtered.map((l) => (
                <label
                  key={l.idRota}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-card-hover cursor-pointer border-b border-card-border last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(l.idRota)}
                    onChange={() => toggle(l.idRota)}
                    className="shrink-0"
                  />
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-black/20"
                    style={{ background: l.corHex }}
                  />
                  <span className="flex-1 min-w-0 text-xs">
                    <span className="font-medium text-text-primary">
                      {l.linha}. {l.nome}
                    </span>
                    {l.sublinha && (
                      <span className="text-text-secondary"> · {l.sublinha}</span>
                    )}
                  </span>
                  <span className="text-xs font-mono text-text-tertiary shrink-0 bg-background-secondary px-1 rounded">
                    {l.idRota}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Componente interno: atualiza coordenadas via ref (sem re-render na raiz) */
function MapInteraction({
  addMode,
  onAdd,
  coordRef,
}: {
  addMode: boolean;
  onAdd: (lat: number, lng: number) => void;
  coordRef: React.RefObject<HTMLDivElement | null>;
}) {
  useMapEvents({
    click(e) {
      if (addMode) onAdd(e.latlng.lat, e.latlng.lng);
    },
    mousemove(e) {
      if (coordRef.current) {
        coordRef.current.textContent = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
      }
    },
  });
  return null;
}

export function AdminParadasTab({
  paradas,
  setParadas,
  linhasData,
}: {
  paradas: Parada[];
  setParadas: (p: Parada[] | ((prev: Parada[]) => Parada[])) => void;
  linhasData: CategoriaLinhas;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const coordRef = useRef<HTMLDivElement>(null);

  const uniqueParadas = useMemo(() => {
    const byId = new Map<string, Parada>();
    for (const p of paradas) {
      if (!byId.has(p.idParada)) byId.set(p.idParada, p);
    }
    return Array.from(byId.values());
  }, [paradas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return uniqueParadas;
    return uniqueParadas.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        p.idParada.toLowerCase().includes(q) ||
        p.descricao?.toLowerCase().includes(q),
    );
  }, [uniqueParadas, search]);

  const selected = paradas.find((p) => p.idParada === selectedId) ?? null;

  const update = useCallback(
    (updated: Parada) => {
      setParadas(paradas.map((p) => (p.idParada === updated.idParada ? updated : p)));
    },
    [paradas, setParadas],
  );

  const handleDragEnd = useCallback(
    (id: string, e: DragEndEvent) => {
      const { lat, lng } = e.target.getLatLng();
      setParadas(
        paradas.map((p) =>
          p.idParada === id ? { ...p, coordenadas: [lat, lng] as [number, number] } : p,
        ),
      );
    },
    [paradas, setParadas],
  );

  const handleAdd = useCallback(
    (lat = DEFAULT_MAP_CENTER[0], lng = DEFAULT_MAP_CENTER[1]) => {
      const id = `P_NEW_${Date.now()}`;
      const nova: Parada = {
        idParada: id,
        nome: 'Nova Parada',
        linhasAtendidas: [],
        categoria: 'Parada Regular',
        descricao: '',
        coordenadas: [lat, lng],
      };
      setParadas([...paradas, nova]);
      setSelectedId(id);
      setAddMode(false);
      setShowDeleteConfirm(false);
    },
    [paradas, setParadas],
  );

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    setParadas(paradas.filter((p) => p.idParada !== selectedId));
    setSelectedId(null);
    setShowDeleteConfirm(false);
  }, [selectedId, paradas, setParadas]);

  const selectParada = (id: string) => {
    setSelectedId(id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {/* Sidebar */}
      <div className="w-96 flex flex-col bg-sidebar h-full overflow-hidden border-r border-card-border shrink-0">
        {/* Cabeçalho: contagem + ações */}
        <div className="p-3 border-b border-card-border bg-card flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">
            {uniqueParadas.length} paradas
          </span>
          {filtered.length !== uniqueParadas.length && (
            <span className="text-xs text-text-secondary">({filtered.length} filtradas)</span>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setAddMode((v) => !v)}
            className={`px-2.5 py-1 text-xs rounded font-medium border transition-colors ${
              addMode
                ? 'bg-success-bg text-success-text border-success-border'
                : 'border-card-border text-text-secondary hover:bg-background-secondary'
            }`}
          >
            {addMode ? (
              <span className="flex items-center gap-1">
                <MousePointerClick size={14} aria-hidden="true" />
                Clique no mapa...
              </span>
            ) : (
              '+ Clicar no mapa'
            )}
          </button>
          <button
            type="button"
            onClick={() => handleAdd()}
            className="px-2.5 py-1 text-xs rounded font-medium border border-card-border text-text-secondary hover:bg-background-secondary transition-colors"
          >
            + Centro
          </button>
        </div>

        {/* Busca */}
        <div className="p-2 border-b border-card-border">
          <input
            type="search"
            placeholder="Buscar por nome ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
          />
        </div>

        {/* Lista de paradas */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-text-secondary">Nenhuma parada encontrada.</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.idParada}
                type="button"
                onClick={() => selectParada(p.idParada)}
                className={`w-full text-left px-3 py-2.5 border-b border-card-border hover:bg-card-hover transition-colors ${
                  selectedId === p.idParada
                    ? 'bg-brand-primary/10 border-l-[3px] border-l-brand-primary pl-2.25'
                    : ''
                }`}
              >
                <div className="text-sm font-medium text-text-primary truncate">{p.nome}</div>
                <div className="text-xs text-text-secondary font-mono">{p.idParada}</div>
              </button>
            ))
          )}
        </div>

        {/* Painel de edição da parada selecionada */}
        {selected && (
          <div className="border-t-2 border-brand-primary bg-card flex flex-col overflow-hidden max-h-[58%]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-card-border shrink-0">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">
                Editando
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setShowDeleteConfirm(false);
                }}
                className="text-text-secondary hover:text-text-primary text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex flex-col gap-3 p-3">
              {/* ID */}
              <div>
                <label
                  htmlFor="ap-id"
                  className="block text-xs font-semibold text-text-primary mb-1 uppercase tracking-wide"
                >
                  ID
                </label>
                <input
                  id="ap-id"
                  type="text"
                  value={selected.idParada}
                  onChange={(e) => update({ ...selected, idParada: e.target.value })}
                  className="w-full h-9 border border-input-border bg-input text-text-primary px-3 rounded text-sm font-mono"
                />
              </div>

              {/* Nome */}
              <div>
                <label
                  htmlFor="ap-nome"
                  className="block text-xs font-semibold text-text-primary mb-1 uppercase tracking-wide"
                >
                  Nome
                </label>
                <textarea
                  id="ap-nome"
                  rows={2}
                  value={selected.nome}
                  onChange={(e) => update({ ...selected, nome: e.target.value })}
                  className="w-full border border-input-border bg-input text-text-primary px-3 py-2 rounded text-sm resize-none"
                />
              </div>

              {/* Descrição */}
              <div>
                <label
                  htmlFor="ap-desc"
                  className="block text-xs font-semibold text-text-primary mb-1 uppercase tracking-wide"
                >
                  Descrição
                </label>
                <textarea
                  id="ap-desc"
                  rows={2}
                  value={selected.descricao ?? ''}
                  onChange={(e) => update({ ...selected, descricao: e.target.value })}
                  className="w-full border border-input-border bg-input text-text-primary px-3 py-2 rounded text-sm resize-none"
                />
              </div>

              {/* Categoria */}
              <div>
                <label
                  htmlFor="ap-cat"
                  className="block text-xs font-semibold text-text-primary mb-1 uppercase tracking-wide"
                >
                  Categoria
                </label>
                <select
                  id="ap-cat"
                  value={selected.categoria}
                  onChange={(e) => update({ ...selected, categoria: e.target.value })}
                  className="w-full h-9 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
                >
                  {CATEGORIA_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Linhas atendidas */}
              <div>
                <span className="block text-xs font-semibold text-text-primary mb-1 uppercase tracking-wide">
                  Linhas Atendidas
                </span>
                <LinhasMultiPicker
                  linhasData={linhasData}
                  selected={selected.linhasAtendidas}
                  onChange={(ids) => update({ ...selected, linhasAtendidas: ids })}
                />
              </div>

              {/* Linhas BHTrans */}
              <div>
                <label
                  htmlFor="ap-bhtrans"
                  className="block text-xs font-semibold text-text-primary mb-1 uppercase tracking-wide"
                >
                  Linhas BHTrans{' '}
                  <span className="normal-case font-normal">(separadas por vírgula, ex: 9502, 5102)</span>
                </label>
                <input
                  id="ap-bhtrans"
                  type="text"
                  value={(selected.bhtransLinhas ?? []).join(', ')}
                  onChange={(e) =>
                    update({
                      ...selected,
                      bhtransLinhas: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="ex: 9502, 5102, S53"
                  className="w-full h-9 border border-input-border bg-input text-text-primary px-3 rounded text-sm"
                />
              </div>

              {/* Coordenadas */}
              <div>
                <span className="block text-xs font-semibold text-text-primary mb-1 uppercase tracking-wide">
                  Coordenadas <span className="normal-case font-normal">(ou arraste no mapa)</span>
                </span>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label
                      htmlFor="ap-lat"
                      className="block text-xs font-semibold text-text-primary mb-1"
                    >
                      Latitude
                    </label>
                    <input
                      id="ap-lat"
                      type="number"
                      step="0.00001"
                      value={selected.coordenadas[0]}
                      onChange={(e) =>
                        update({
                          ...selected,
                          coordenadas: [Number(e.target.value), selected.coordenadas[1]],
                        })
                      }
                      className="w-full h-9 border border-input-border bg-input text-text-primary px-2 rounded text-xs font-mono"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="ap-lng"
                      className="block text-xs font-semibold text-text-primary mb-1"
                    >
                      Longitude
                    </label>
                    <input
                      id="ap-lng"
                      type="number"
                      step="0.00001"
                      value={selected.coordenadas[1]}
                      onChange={(e) =>
                        update({
                          ...selected,
                          coordenadas: [selected.coordenadas[0], Number(e.target.value)],
                        })
                      }
                      className="w-full h-9 border border-input-border bg-input text-text-primary px-2 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Exclusão */}
              <div className="pt-1 border-t border-card-border">
                {showDeleteConfirm ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-warning-text">
                      Tem certeza? Use Ctrl+Z para desfazer depois.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="flex-1 py-2 bg-brand-accent neo-brutal-sm text-text-inverse text-xs font-bold hover:bg-brand-accent/90 transition-colors"
                      >
                        Confirmar exclusão
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 neo-brutal-sm text-text-secondary text-xs hover:bg-background-secondary"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2 bg-brand-accent neo-brutal-sm text-text-inverse text-xs font-bold hover:bg-brand-accent/90 transition-colors"
                  >
                    Excluir parada
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        {/* Display de coordenadas (atualizado via ref, sem re-render) */}
        <div
          ref={coordRef}
          className="absolute bottom-2 left-2 z-1000 bg-card/90 text-text-secondary text-xs px-2 py-1 rounded border border-card-border font-mono pointer-events-none select-none"
        >
          Mova o cursor...
        </div>

        {/* Banner de modo adição */}
        {addMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-1000 bg-success-bg text-success-text text-sm px-4 py-2 rounded-full border border-success-border font-medium shadow-lg pointer-events-none flex items-center gap-1.5">
            <MousePointerClick size={14} aria-hidden="true" />
            Clique no mapa para adicionar uma parada
          </div>
        )}

        <MapContainer
          center={DEFAULT_MAP_CENTER}
          zoom={15}
          className="h-full w-full"
          style={addMode ? { cursor: 'crosshair' } : undefined}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapInteraction addMode={addMode} onAdd={handleAdd} coordRef={coordRef} />

          {uniqueParadas.map((p) => (
            <Marker
              key={p.idParada}
              position={p.coordenadas}
              icon={p.idParada === selectedId ? highlightedIcon : stationIcon}
              draggable
              eventHandlers={{
                dragend: (e) => handleDragEnd(p.idParada, e),
                click: () => selectParada(p.idParada),
              }}
            >
              <Popup>
                <strong>{p.nome}</strong>
                <br />
                <code className="text-xs">{p.idParada}</code>
                <br />
                <code className="text-xs">
                  {p.coordenadas[0].toFixed(5)}, {p.coordenadas[1].toFixed(5)}
                </code>
              </Popup>
            </Marker>
          ))}

          {/* Rotas das linhas em modo fantasma */}
          {linhasData.categoriasDias
            .flatMap((cd) => cd.linhas)
            .filter((l) => l.coordenadasTrajeto.length > 1)
            .map((l) => (
              <Polyline
                key={l.idRota}
                positions={l.coordenadasTrajeto}
                pathOptions={{ color: l.corHex, weight: 2, opacity: 0.3, dashArray: '4,4' }}
              />
            ))}
        </MapContainer>
      </div>
    </>
  );
}
