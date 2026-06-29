import { Pencil, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type DragEndEvent } from 'leaflet';
import icon from '../../assets/marker.svg';
import { DEFAULT_MAP_CENTER } from '../../config/mapDefaults';
import type { CategoriaLinhas, Linha, Parada } from '../../types/data.types';

const stationIcon = L.icon({
  iconUrl: icon,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const vertexIcon = L.divIcon({
  className: '',
  html: '<div style="width:10px;height:10px;background:white;border:2px solid #333;border-radius:50%;cursor:pointer"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

/** Calcula a distância de um ponto a um segmento de reta (em graus — serve para coordenadas próximas) */
function distToSegment(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[1] - a[1];
  const dy = b[0] - a[0];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p[1] - a[1], p[0] - a[0]);
  const t = Math.max(0, Math.min(1, ((p[1] - a[1]) * dx + (p[0] - a[0]) * dy) / lenSq));
  return Math.hypot(p[1] - (a[1] + t * dx), p[0] - (a[0] + t * dy));
}

/** Insere um ponto entre os dois vértices do segmento mais próximo */
function insertNearestSegment(
  coords: [number, number][],
  point: [number, number],
): [number, number][] {
  if (coords.length < 2) return [...coords, point];
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = distToSegment(point, coords[i], coords[i + 1]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return [...coords.slice(0, best + 1), point, ...coords.slice(best + 1)];
}

function MapEvents({
  drawMode,
  onAddPoint,
}: {
  drawMode: boolean;
  onAddPoint: (p: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (drawMode) onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

const FIELD_LABEL = 'block text-xs font-semibold text-text-primary mb-1 uppercase tracking-wide';
const FIELD_INPUT =
  'w-full h-9 border border-input-border bg-input text-text-primary px-3 rounded text-sm';
const BTN_SMALL = 'px-2.5 py-1.5 text-xs rounded border transition-colors';

/** Seletor customizado com swatch de cor, nome, sublinha e idRota para fácil diferenciação */
function LinhaSelector({
  linhas,
  selectedId,
  onChange,
}: {
  linhas: Linha[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = linhas.find((l) => l.idRota === selectedId) ?? null;

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      {/* Botão de trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-9 flex items-center gap-2 border border-input-border bg-input text-text-primary px-2.5 rounded text-sm text-left truncate hover:bg-card-hover transition-colors"
      >
        {selected ? (
          <>
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20"
              style={{ background: selected.corHex }}
            />
            <span className="truncate flex-1 min-w-0">
              <span className="font-medium">{selected.linha}.</span> {selected.nome}
              {selected.sublinha ? (
                <span className="text-text-secondary"> · {selected.sublinha}</span>
              ) : null}
            </span>
            <span className="text-text-tertiary font-mono text-xs shrink-0">{selected.idRota}</span>
          </>
        ) : (
          <span className="text-text-secondary">-- Selecione --</span>
        )}
        <span className="ml-auto text-text-secondary text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {/* Lista dropdown */}
      {open && (
        <div className="absolute z-9999 top-full left-0 right-0 mt-1 bg-card neo-brutal max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-card-hover border-b border-card-border"
          >
            -- Selecione --
          </button>
          {linhas.map((l) => (
            <button
              key={l.idRota}
              type="button"
              onClick={() => {
                onChange(l.idRota);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-card-hover transition-colors border-b border-card-border last:border-0 ${
                l.idRota === selectedId ? 'bg-brand-primary/10' : ''
              }`}
            >
              {/* Swatch */}
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20"
                style={{ background: l.corHex }}
              />
              {/* Nome principal */}
              <span className="flex-1 min-w-0">
                <span className="text-sm font-medium text-text-primary">
                  <span className="text-text-secondary">{l.linha}.</span> {l.nome}
                </span>
                {l.sublinha && (
                  <span className="block text-xs text-text-secondary">{l.sublinha}</span>
                )}
              </span>
              {/* ID único */}
              <span className="text-xs font-mono text-text-tertiary shrink-0 bg-background-secondary px-1.5 py-0.5 rounded">
                {l.idRota}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Picker visual para montar itinerário de paradas (ordenado) */
function ParadasPicker({
  paradas,
  itinerario,
  onChange,
}: {
  paradas: Parada[];
  itinerario: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const uniqueParadas = useMemo(() => {
    const byId = new Map<string, Parada>();
    for (const p of paradas) {
      if (!byId.has(p.idParada)) byId.set(p.idParada, p);
    }
    return Array.from(byId.values());
  }, [paradas]);

  const disponiveis = useMemo(() => {
    const q = search.trim().toLowerCase();
    return uniqueParadas.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        p.idParada.toLowerCase().includes(q),
    );
  }, [uniqueParadas, search]);

  const addParada = (idParada: string) => {
    if (itinerario.includes(idParada)) return;
    onChange([...itinerario, idParada]);
  };

  const removeParada = (idx: number) => {
    onChange(itinerario.filter((_, i) => i !== idx));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...itinerario];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  const moveDown = (idx: number) => {
    if (idx === itinerario.length - 1) return;
    const next = [...itinerario];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };

  const handleSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && disponiveis.length > 0) {
      addParada(disponiveis[0].idParada);
      setSearch('');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Lista ordenada do itinerário atual */}
      {itinerario.length > 0 ? (
        <ol className="space-y-1 max-h-36 overflow-y-auto border border-card-border rounded p-1.5 bg-background-secondary">
          {itinerario.map((idParada, idx) => {
            const p = uniqueParadas.find((x) => x.idParada === idParada);
            return (
              <li
                key={`${idParada}-${idx}`}
                className="flex items-center gap-1 text-xs bg-card rounded px-2 py-1 border border-card-border"
              >
                <span className="text-text-tertiary font-mono w-5 text-right shrink-0">
                  {idx + 1}.
                </span>
                <span className="flex-1 min-w-0 truncate text-text-primary">
                  {p ? p.nome : idParada}
                  <span className="text-text-tertiary font-mono ml-1">({idParada})</span>
                </span>
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="text-text-secondary hover:text-text-primary disabled:opacity-30 px-0.5"
                  title="Mover para cima"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === itinerario.length - 1}
                  className="text-text-secondary hover:text-text-primary disabled:opacity-30 px-0.5"
                  title="Mover para baixo"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => removeParada(idx)}
                  className="text-text-secondary hover:text-brand-accent px-0.5"
                  title="Remover parada"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-xs text-text-secondary italic">Nenhuma parada no itinerário.</p>
      )}

      {/* Busca e adição de paradas */}
      <div className="flex gap-1.5">
        <input
          ref={searchRef}
          type="search"
          placeholder="Buscar parada para adicionar (Enter)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKey}
          className="flex-1 h-8 border border-input-border bg-input text-text-primary px-2 rounded text-xs"
        />
      </div>
      {search.trim() && (
        <div className="border border-card-border rounded bg-card max-h-40 overflow-y-auto">
          {disponiveis.length === 0 ? (
            <p className="p-2 text-xs text-text-secondary">Nenhuma parada encontrada.</p>
          ) : (
            disponiveis.slice(0, 20).map((p) => (
              <button
                key={p.idParada}
                type="button"
                onClick={() => {
                  addParada(p.idParada);
                  setSearch('');
                  searchRef.current?.focus();
                }}
                disabled={itinerario.includes(p.idParada)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-card-hover border-b border-card-border last:border-0 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="flex-1 min-w-0 truncate text-text-primary">{p.nome}</span>
                <span className="text-text-tertiary font-mono shrink-0">{p.idParada}</span>
                {itinerario.includes(p.idParada) && (
                  <span className="text-success-text text-xs shrink-0">✓</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function AdminLinhasTab({
  linhasData,
  setLinhasData,
  paradas,
}: {
  linhasData: CategoriaLinhas;
  setLinhasData: (l: CategoriaLinhas | ((prev: CategoriaLinhas) => CategoriaLinhas)) => void;
  paradas: Parada[];
}) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [horariosDraft, setHorariosDraft] = useState<string | null>(null);
  const [showDeleteLinhaConfirm, setShowDeleteLinhaConfirm] = useState(false);

  const activeCategory = linhasData.categoriasDias[activeCategoryIdx];
  const selectedLinha = activeCategory?.linhas.find((l) => l.idRota === selectedRouteId) ?? null;

  const uniqueParadas = useMemo(() => {
    const byId = new Map<string, Parada>();
    for (const p of paradas) {
      if (!byId.has(p.idParada)) byId.set(p.idParada, p);
    }
    return Array.from(byId.values());
  }, [paradas]);

  const updateCats = useCallback(
    (updater: (cats: CategoriaLinhas['categoriasDias']) => CategoriaLinhas['categoriasDias']) => {
      setLinhasData({ categoriasDias: updater(linhasData.categoriasDias) });
    },
    [linhasData, setLinhasData],
  );

  const updateLinha = useCallback(
    (updated: Linha) => {
      updateCats((cats) =>
        cats.map((cat, i) =>
          i === activeCategoryIdx
            ? { ...cat, linhas: cat.linhas.map((l) => (l.idRota === updated.idRota ? updated : l)) }
            : cat,
        ),
      );
    },
    [activeCategoryIdx, updateCats],
  );

  const handleDragVertex = useCallback(
    (idx: number, e: DragEndEvent) => {
      if (!selectedLinha) return;
      const { lat, lng } = e.target.getLatLng();
      const newCoords = [...selectedLinha.coordenadasTrajeto];
      newCoords[idx] = [lat, lng];
      updateLinha({ ...selectedLinha, coordenadasTrajeto: newCoords });
    },
    [selectedLinha, updateLinha],
  );

  const handleDeleteVertex = useCallback(
    (idx: number) => {
      if (!selectedLinha) return;
      updateLinha({
        ...selectedLinha,
        coordenadasTrajeto: selectedLinha.coordenadasTrajeto.filter((_, i) => i !== idx),
      });
    },
    [selectedLinha, updateLinha],
  );

  const handleAddPoint = useCallback(
    (point: [number, number]) => {
      if (!selectedLinha) return;
      updateLinha({
        ...selectedLinha,
        coordenadasTrajeto: [...selectedLinha.coordenadasTrajeto, point],
      });
    },
    [selectedLinha, updateLinha],
  );

  const handlePolylineClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (!selectedLinha || drawMode) return;
      L.DomEvent.stopPropagation(e);
      const point: [number, number] = [e.latlng.lat, e.latlng.lng];
      updateLinha({
        ...selectedLinha,
        coordenadasTrajeto: insertNearestSegment(selectedLinha.coordenadasTrajeto, point),
      });
    },
    [selectedLinha, drawMode, updateLinha],
  );

  const handleReverseRoute = useCallback(() => {
    if (!selectedLinha) return;
    updateLinha({
      ...selectedLinha,
      coordenadasTrajeto: [...selectedLinha.coordenadasTrajeto].reverse(),
    });
  }, [selectedLinha, updateLinha]);

  const handleClearRoute = useCallback(() => {
    if (!selectedLinha) return;
    updateLinha({ ...selectedLinha, coordenadasTrajeto: [] });
  }, [selectedLinha, updateLinha]);

  const handleAddLinha = useCallback(() => {
    if (!activeCategory) return;
    const newId = `${activeCategory.categoriaDia}_NEW_${Date.now()}`;
    const nova: Linha = {
      idRota: newId,
      linha: 99,
      nome: 'Nova Linha',
      tipo: 'circular',
      sublinha: null,
      categoriaDia: activeCategory.categoriaDia,
      corHex: '#888888',
      descricao: '',
      horarios: [],
      itinerarioParadasIds: [],
      coordenadasTrajeto: [],
    };
    updateCats((cats) =>
      cats.map((cat, i) =>
        i === activeCategoryIdx ? { ...cat, linhas: [...cat.linhas, nova] } : cat,
      ),
    );
    setSelectedRouteId(newId);
    setHorariosDraft(null);
    setShowDeleteLinhaConfirm(false);
    setDrawMode(false);
  }, [activeCategory, activeCategoryIdx, updateCats]);

  const handleDeleteLinha = useCallback(() => {
    if (!selectedRouteId) return;
    updateCats((cats) =>
      cats.map((cat, i) =>
        i === activeCategoryIdx
          ? { ...cat, linhas: cat.linhas.filter((l) => l.idRota !== selectedRouteId) }
          : cat,
      ),
    );
    setSelectedRouteId(null);
    setShowDeleteLinhaConfirm(false);
  }, [selectedRouteId, activeCategoryIdx, updateCats]);

  const horariosValue = horariosDraft ?? JSON.stringify(selectedLinha?.horarios ?? [], null, 2);
  const vertexCount = selectedLinha?.coordenadasTrajeto.length ?? 0;

  const selectLinha = (id: string | null) => {
    setSelectedRouteId(id);
    setHorariosDraft(null);
    setShowDeleteLinhaConfirm(false);
    setDrawMode(false);
  };

  return (
    <>
      {/* Sidebar */}
      <div className="w-96 flex flex-col bg-sidebar h-full overflow-hidden border-r border-card-border shrink-0">
        {/* Seletor de categoria */}
        <div className="p-3 border-b border-card-border">
          <label htmlFor="al-categoria" className={FIELD_LABEL}>
            Categoria do Dia
          </label>
          <select
            id="al-categoria"
            value={activeCategoryIdx}
            onChange={(e) => {
              setActiveCategoryIdx(Number(e.target.value));
              selectLinha(null);
            }}
            className={FIELD_INPUT}
          >
            {linhasData.categoriasDias.map((cat, idx) => (
              <option key={cat.id} value={idx}>
                {cat.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Seletor de linha + adicionar/excluir */}
        <div className="p-3 border-b border-card-border">
          <p className={FIELD_LABEL}>
            Linha{' '}
            <span className="normal-case font-normal">
              ({activeCategory?.linhas.length ?? 0} cadastradas)
            </span>
          </p>
          <div className="flex gap-1.5">
            <LinhaSelector
              linhas={activeCategory?.linhas ?? []}
              selectedId={selectedRouteId}
              onChange={selectLinha}
            />
            <button
              type="button"
              onClick={handleAddLinha}
              title="Nova linha nesta categoria"
              className="px-2.5 py-1.5 text-xs rounded border border-success-border text-success-text bg-success-bg hover:opacity-90 transition-opacity"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteLinhaConfirm(true)}
              disabled={!selectedRouteId}
              title="Excluir linha selecionada"
              className="px-2.5 py-1.5 text-xs rounded border border-warning-border text-warning-text bg-warning-bg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              −
            </button>
          </div>

          {showDeleteLinhaConfirm && (
            <div className="mt-2 flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-warning-text">
                Excluir esta linha? Use Ctrl+Z para desfazer.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteLinha}
                  className="flex-1 py-1.5 bg-brand-accent neo-brutal-sm text-text-inverse text-xs font-bold hover:bg-brand-accent/90 transition-colors"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteLinhaConfirm(false)}
                  className="flex-1 py-1.5 neo-brutal-sm text-text-secondary text-xs hover:bg-background-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Editor da linha */}
        <div className="flex-1 overflow-y-auto p-3">
          {!selectedLinha ? (
            <p className="text-sm text-text-secondary">Selecione ou crie uma linha para editar.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Nome */}
              <div>
                <label htmlFor="al-nome" className={FIELD_LABEL}>
                  Nome
                </label>
                <textarea
                  id="al-nome"
                  rows={2}
                  value={selectedLinha.nome}
                  onChange={(e) => updateLinha({ ...selectedLinha, nome: e.target.value })}
                  className="w-full border border-input-border bg-input text-text-primary px-3 py-2 rounded text-sm resize-none"
                />
              </div>

              {/* Cor */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="al-cor-hex" className={FIELD_LABEL}>
                    Cor
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="color"
                      value={selectedLinha.corHex}
                      onChange={(e) => updateLinha({ ...selectedLinha, corHex: e.target.value })}
                      title="Selecionar cor"
                      className="h-9 w-10 rounded border border-input-border cursor-pointer p-0.5 bg-transparent shrink-0"
                    />
                    <input
                      id="al-cor-hex"
                      type="text"
                      value={selectedLinha.corHex}
                      onChange={(e) => updateLinha({ ...selectedLinha, corHex: e.target.value })}
                      maxLength={7}
                      className="flex-1 h-9 border border-input-border bg-input text-text-primary px-2 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ID + Tipo */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="al-id" className={FIELD_LABEL}>
                    ID da Rota
                  </label>
                  <input
                    id="al-id"
                    type="text"
                    value={selectedLinha.idRota}
                    onChange={(e) => updateLinha({ ...selectedLinha, idRota: e.target.value })}
                    className="w-full h-9 border border-input-border bg-input text-text-primary px-2 rounded text-xs font-mono"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="al-tipo" className={FIELD_LABEL}>
                    Tipo
                  </label>
                  <input
                    id="al-tipo"
                    type="text"
                    value={selectedLinha.tipo}
                    onChange={(e) => updateLinha({ ...selectedLinha, tipo: e.target.value })}
                    className="w-full h-9 border border-input-border bg-input text-text-primary px-3 rounded text-xs"
                  />
                </div>
              </div>

              {/* Sublinha */}
              <div>
                <label htmlFor="al-sublinha" className={FIELD_LABEL}>
                  Sublinha
                </label>
                <input
                  id="al-sublinha"
                  type="text"
                  value={selectedLinha.sublinha ?? ''}
                  placeholder="(nenhuma)"
                  onChange={(e) =>
                    updateLinha({ ...selectedLinha, sublinha: e.target.value || null })
                  }
                  className={FIELD_INPUT}
                />
              </div>

              {/* Descrição */}
              <div>
                <label htmlFor="al-desc" className={FIELD_LABEL}>
                  Descrição
                </label>
                <textarea
                  id="al-desc"
                  rows={2}
                  value={selectedLinha.descricao}
                  onChange={(e) => updateLinha({ ...selectedLinha, descricao: e.target.value })}
                  className="w-full border border-input-border bg-input text-text-primary px-3 py-2 rounded text-sm resize-none"
                />
              </div>

              {/* Itinerário */}
              <div>
                <span className={FIELD_LABEL}>
                  Itinerário{' '}
                  <span className="normal-case font-normal">
                    ({selectedLinha.itinerarioParadasIds.length} paradas)
                  </span>
                </span>
                <ParadasPicker
                  paradas={uniqueParadas}
                  itinerario={selectedLinha.itinerarioParadasIds}
                  onChange={(ids) => updateLinha({ ...selectedLinha, itinerarioParadasIds: ids })}
                />
              </div>

              {/* Horários */}
              <div>
                <label htmlFor="al-horarios" className={FIELD_LABEL}>
                  Horários <span className="normal-case font-normal">(JSON array de strings)</span>
                </label>
                <textarea
                  id="al-horarios"
                  rows={6}
                  value={horariosValue}
                  onChange={(e) => {
                    setHorariosDraft(e.target.value);
                    try {
                      const val = JSON.parse(e.target.value);
                      // 🛡️ Sentinel: Validate array elements to prevent insecure deserialization
                      if (Array.isArray(val) && val.every((item) => typeof item === 'string')) {
                        updateLinha({ ...selectedLinha, horarios: val });
                      }
                    } catch {
                      // aguarda JSON válido
                    }
                  }}
                  className="w-full border border-input-border bg-input text-text-primary p-3 rounded text-xs font-mono resize-none"
                />
                <p className="text-xs text-text-secondary mt-0.5">
                  {selectedLinha.horarios.length} horários cadastrados
                </p>
              </div>

              {/* Seção do Trajeto */}
              <div className="border-t border-card-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={FIELD_LABEL}>Trajeto no Mapa</span>
                  <span className="text-xs text-text-secondary font-mono">
                    {vertexCount} vértices
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {/* Modo desenho */}
                  <button
                    type="button"
                    onClick={() => setDrawMode((v) => !v)}
                    className={`${BTN_SMALL} ${
                      drawMode
                        ? 'bg-info-bg text-info-text border-info-border'
                        : 'border-card-border text-text-secondary hover:bg-background-secondary'
                    }`}
                  >
                    {drawMode ? (
                      <span className="flex items-center gap-1">
                        <Pencil size={14} aria-hidden="true" />
                        Desenhando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Pencil size={14} aria-hidden="true" />
                        Desenhar
                      </span>
                    )}
                  </button>

                  {/* Inverter rota */}
                  <button
                    type="button"
                    onClick={handleReverseRoute}
                    disabled={vertexCount < 2}
                    title="Inverter sentido do trajeto"
                    className={`${BTN_SMALL} border-card-border text-text-secondary hover:bg-background-secondary disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    ⇄ Inverter
                  </button>

                  {/* Limpar rota */}
                  <button
                    type="button"
                    onClick={handleClearRoute}
                    disabled={vertexCount === 0}
                    title="Apagar todo o trajeto"
                    className={`${BTN_SMALL} border-warning-border text-warning-text bg-warning-bg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <span className="flex items-center gap-1">
                      <Trash2 size={14} aria-hidden="true" />
                      Limpar
                    </span>
                  </button>
                </div>

                {/* Dica contextual */}
                {drawMode ? (
                  <p className="text-xs text-info-text mt-2">
                    Clique no mapa para adicionar vértices ao <strong>final</strong> do trajeto.
                    Clique em um vértice (marcador branco) para excluí-lo.
                  </p>
                ) : vertexCount > 1 ? (
                  <p className="text-xs text-text-secondary mt-2">
                    Clique sobre a <strong>linha colorida</strong> para inserir um vértice no
                    segmento mais próximo. Clique em um vértice para excluí-lo.
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        <MapContainer center={DEFAULT_MAP_CENTER} zoom={15} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents drawMode={drawMode} onAddPoint={handleAddPoint} />

          {/* Todas as paradas */}
          {uniqueParadas.map((p) => (
            <Marker key={p.idParada} position={p.coordenadas} icon={stationIcon}>
              <Popup>
                <strong>{p.nome}</strong>
                <br />
                <code className="text-xs">{p.idParada}</code>
              </Popup>
            </Marker>
          ))}

          {/* Rotas de outras linhas em modo fantasma */}
          {linhasData.categoriasDias
            .flatMap((cd) => cd.linhas)
            .filter((l) => l.idRota !== selectedRouteId && l.coordenadasTrajeto.length > 1)
            .map((l) => (
              <Polyline
                key={`bg-${l.idRota}`}
                positions={l.coordenadasTrajeto}
                pathOptions={{ color: l.corHex, weight: 2, opacity: 0.25, dashArray: '4,4' }}
              />
            ))}

          {/* Rota selecionada */}
          {selectedLinha && selectedLinha.coordenadasTrajeto.length > 1 && (
            <Polyline
              positions={selectedLinha.coordenadasTrajeto}
              pathOptions={{ color: selectedLinha.corHex, weight: 5, opacity: 0.9 }}
              eventHandlers={{ click: handlePolylineClick }}
            />
          )}

          {/* Vértices da rota selecionada */}
          {selectedLinha?.coordenadasTrajeto.map((coord, idx) => (
            <Marker
              // biome-ignore lint/suspicious/noArrayIndexKey: a ordem dos vértices é intencional e estável
              key={`v${idx}`}
              position={coord}
              icon={vertexIcon}
              draggable
              eventHandlers={{
                dragend: (e) => handleDragVertex(idx, e),
                click: () => handleDeleteVertex(idx),
              }}
            />
          ))}
        </MapContainer>
      </div>
    </>
  );
}
