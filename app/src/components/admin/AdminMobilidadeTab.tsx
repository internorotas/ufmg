import { useEffect, useState } from 'react';
import { resolveApiEndpoint, withTenantHeaders } from '../../services/api/apiClient';

interface MobilidadeSnapshot {
  eventos1h: number;
  eventos24h: number;
  veiculosAtivos1h: number;
  ultimoEvento: string | null;
  porLinha: { linha: string; total: number; veiculos: number }[];
}

function timeAgo(iso: string): string {
  const diffS = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffS < 10) return 'agora mesmo';
  if (diffS < 60) return `${diffS}s atrás`;
  if (diffS < 3600) return `${Math.floor(diffS / 60)} min atrás`;
  return `${Math.floor(diffS / 3600)}h atrás`;
}

export function AdminMobilidadeTab() {
  const [data, setData] = useState<MobilidadeSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(resolveApiEndpoint('/v1/admin/telemetria/mobilidade'), {
          headers: withTenantHeaders(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as MobilidadeSnapshot;
        if (!cancelled) {
          setData(json);
          setError(null);
          setLastRefresh(new Date());
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const id = setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const cell = 'px-3 py-2 text-xs';
  const th = `${cell} font-semibold text-text-secondary bg-background-secondary border-b border-card-border text-left`;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm text-text-primary">Mobilidade — BHTrans ao vivo</h2>
        <span className="text-xs text-text-tertiary">
          {loading ? 'Carregando…' : `Atualizado às ${lastRefresh.toLocaleTimeString('pt-BR')}`}
        </span>
      </div>

      {error && (
        <div className="rounded border border-error-border bg-error-bg px-3 py-2 text-xs text-error-text">
          Erro ao carregar: {error}
        </div>
      )}

      {data && (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Eventos (1h)', value: data.eventos1h.toLocaleString('pt-BR') },
              { label: 'Eventos (24h)', value: data.eventos24h.toLocaleString('pt-BR') },
              { label: 'Veículos ativos (1h)', value: data.veiculosAtivos1h.toLocaleString('pt-BR') },
              {
                label: 'Último evento',
                value: data.ultimoEvento ? timeAgo(data.ultimoEvento) : '—',
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-1 rounded border border-card-border bg-card p-3 neo-brutal-sm"
              >
                <span className="text-[10px] text-text-tertiary uppercase tracking-wide">{label}</span>
                <span className="text-xl font-bold text-text-primary leading-tight">{value}</span>
              </div>
            ))}
          </div>

          {/* Tabela por linha */}
          <div className="overflow-x-auto rounded border border-card-border neo-brutal-sm">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className={th}>Linha BHTrans</th>
                  <th className={`${th} text-right`}>Eventos (1h)</th>
                  <th className={`${th} text-right`}>Veículos (1h)</th>
                </tr>
              </thead>
              <tbody>
                {data.porLinha.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={`${cell} text-text-tertiary text-center py-4`}>
                      Nenhum evento no último 1h — poller pode estar pausado ou API BHTrans indisponível
                    </td>
                  </tr>
                ) : (
                  data.porLinha.map((row) => (
                    <tr key={row.linha} className="border-t border-card-border hover:bg-background-secondary">
                      <td className={cell}>
                        <span className="rounded bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 font-mono font-semibold text-orange-700 dark:text-orange-400">
                          {row.linha}
                        </span>
                      </td>
                      <td className={`${cell} text-right tabular-nums`}>{row.total.toLocaleString('pt-BR')}</td>
                      <td className={`${cell} text-right tabular-nums`}>{row.veiculos}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data.ultimoEvento && (
            <p className="text-[10px] text-text-tertiary">
              Último evento registrado: {new Date(data.ultimoEvento).toLocaleString('pt-BR')}
            </p>
          )}
        </>
      )}
    </div>
  );
}
