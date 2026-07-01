import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveApiEndpoint, withTenantHeaders } from '../../services/api/apiClient';
import { getAdminHeaders } from '../../services/api/adminAuth';

interface AdminBuilding {
  id: string;
  name: string;
  amenity: string | null;
  description: string | null;
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function useBuildingList() {
  const [buildings, setBuildings] = useState<AdminBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(resolveApiEndpoint('/v1/admin/map-buildings'), {
        headers: withTenantHeaders(getAdminHeaders()),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AdminBuilding[];
      setBuildings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { buildings, loading, error, reload: load };
}

async function patchBuilding(
  id: string,
  body: { description?: string | null; properties?: Record<string, unknown> },
): Promise<void> {
  const res = await fetch(resolveApiEndpoint(`/v1/admin/map-buildings/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...withTenantHeaders(getAdminHeaders()) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

async function importOsm(): Promise<{ imported: number; skipped: number; errors: number }> {
  const res = await fetch(resolveApiEndpoint('/v1/admin/map-buildings/import-osm'), {
    method: 'POST',
    headers: withTenantHeaders(getAdminHeaders()),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ imported: number; skipped: number; errors: number }>;
}

export function AdminPrediosTab() {
  const { buildings, loading, error, reload } = useBuildingList();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Draft local para edição
  const [draftDesc, setDraftDesc] = useState('');
  const [draftBanner, setDraftBanner] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return buildings;
    return buildings.filter(
      (b) => b.name.toLowerCase().includes(q) || b.amenity?.toLowerCase().includes(q),
    );
  }, [buildings, search]);

  const selected = useMemo(
    () => buildings.find((b) => b.id === selectedId) ?? null,
    [buildings, selectedId],
  );

  useEffect(() => {
    if (selected) {
      setDraftDesc(selected.description ?? '');
      setDraftBanner((selected.properties.banner_url as string | undefined) ?? '');
      setSaveError(null);
    }
  }, [selected]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    try {
      await patchBuilding(selected.id, {
        description: draftDesc.trim() || null,
        properties: { ...selected.properties, banner_url: draftBanner.trim() || undefined },
      });
      await reload();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importOsm();
      setImportResult(
        `Importados: ${result.imported} | Pulados: ${result.skipped} | Erros: ${result.errors}`,
      );
      await reload();
    } catch (err) {
      setImportResult(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImporting(false);
    }
  };

  const label = 'block text-xs font-semibold text-text-primary mb-1 uppercase tracking-wide';
  const input = 'w-full border border-input-border bg-input text-text-primary px-3 rounded text-sm';

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Sidebar */}
      <div className="w-80 flex flex-col bg-sidebar h-full overflow-hidden border-r border-card-border shrink-0">
        <div className="p-3 border-b border-card-border bg-card flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">
            {loading ? '...' : `${buildings.length} prédios`}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing}
            className="px-2.5 py-1 text-xs rounded font-medium border border-card-border text-text-secondary hover:bg-background-secondary transition-colors disabled:opacity-50"
          >
            {importing ? 'Importando…' : '↓ Import OSM'}
          </button>
        </div>

        {importResult && (
          <div className="px-3 py-2 text-xs text-text-secondary bg-background-secondary border-b border-card-border">
            {importResult}
          </div>
        )}

        {error && (
          <div className="px-3 py-2 text-xs text-error-text bg-error-bg border-b border-error-border">
            Erro ao carregar: {error}
          </div>
        )}

        <div className="p-2 border-b border-card-border">
          <input
            type="search"
            placeholder="Buscar por nome ou amenidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${input} h-9`}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-xs text-text-secondary">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-xs text-text-secondary">Nenhum prédio. Use ↓ Import OSM.</p>
          ) : (
            filtered.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedId(b.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-card-border hover:bg-card-hover transition-colors ${
                  selectedId === b.id
                    ? 'bg-brand-primary/10 border-l-[3px] border-l-brand-primary pl-[9px]'
                    : ''
                }`}
              >
                <div className="text-sm font-medium text-text-primary truncate">{b.name}</div>
                {b.amenity && <div className="text-xs text-text-tertiary">{b.amenity}</div>}
                {(b.description || Boolean(b.properties.banner_url)) && (
                  <div className="flex gap-1.5 mt-0.5">
                    {b.description && (
                      <span className="text-[10px] rounded bg-blue-100 text-blue-700 px-1">
                        desc
                      </span>
                    )}
                    {Boolean(b.properties.banner_url) && (
                      <span className="text-[10px] rounded bg-green-100 text-green-700 px-1">
                        banner
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Painel de edição */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-tertiary">
            <p className="text-sm">Selecione um prédio para editar</p>
            <p className="text-xs">Adicione descrição e banner para exibir no mapa ao clicar</p>
          </div>
        ) : (
          <div className="max-w-lg flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-text-primary">{selected.name}</h3>
              {selected.amenity && (
                <span className="text-xs text-text-secondary">{selected.amenity}</span>
              )}
            </div>

            <div>
              <label htmlFor="ap-desc" className={label}>
                Descrição
              </label>
              <textarea
                id="ap-desc"
                rows={4}
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
                placeholder="Descrição exibida no card ao clicar no prédio no mapa…"
                className={`${input} py-2 resize-none`}
              />
            </div>

            <div>
              <label htmlFor="ap-banner" className={label}>
                Banner URL
              </label>
              <input
                id="ap-banner"
                type="url"
                value={draftBanner}
                onChange={(e) => setDraftBanner(e.target.value)}
                placeholder="https://exemplo.com/banner.jpg"
                className={`${input} h-9`}
              />
              {draftBanner && (
                <img
                  src={draftBanner}
                  alt="Preview do banner"
                  className="mt-2 w-full max-h-32 object-cover rounded border border-card-border"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <p className="mt-1 text-[10px] text-text-tertiary">
                Imagem exibida no topo do card do prédio. Proporção 3:1 recomendada.
              </p>
            </div>

            {saveError && <p className="text-xs text-error-text">{saveError}</p>}

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="px-4 py-2 text-sm neo-brutal-sm font-semibold bg-brand-primary text-text-inverse hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
