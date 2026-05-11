import { Database, Download, Mail } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  fetchResearchExportPreview,
  requestResearchExport,
} from '@/services/research/researchClient';

interface ExportFeedback {
  type: 'success' | 'error';
  message: string;
}

export function ResearchDashboardPage() {
  const [email, setEmail] = useState('');
  const [linhaId, setLinhaId] = useState('');
  const [period, setPeriod] = useState('7d');
  const [latestSnapshotWeek, setLatestSnapshotWeek] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<ExportFeedback | null>(null);

  useEffect(() => {
    let active = true;

    void fetchResearchExportPreview({ period })
      .then((preview) => {
        if (!active) {
          return;
        }
        setLatestSnapshotWeek(preview.latestSnapshotWeek);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setFeedback({
          type: 'error',
          message:
            error instanceof Error ? error.message : 'Falha ao carregar dashboard de pesquisa.',
        });
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [period]);

  const handleDownload = useCallback(
    async (format: 'GeoJSON' | 'CSV') => {
      setFeedback(null);
      try {
        const result = await requestResearchExport({
          email,
          format,
          linhaId: linhaId || undefined,
          period,
        });
        setFeedback({
          type: 'success',
          message: `Exportação ${format} pronta. Solicitação ${result.requestId} registrada para ${email}.`,
        });
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Falha ao solicitar exportação.',
        });
      }
    },
    [email, linhaId, period],
  );

  const resumo = useMemo(() => {
    return linhaId ? `Filtro atual: linha ${linhaId}` : 'Filtro atual: todas as linhas';
  }, [linhaId]);

  return (
    <main className="min-h-dvh bg-background-secondary px-4 py-6 text-text-primary sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <header className="rounded-xl border border-card-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <Database size={22} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dashboard público de pesquisa</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Explore a base anonimizada do GPS colaborativo sem login e solicite exportação em
                GeoJSON ou CSV.
              </p>
            </div>
          </div>
        </header>

        {feedback ? (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-success-border bg-success-bg text-success-text'
                : 'border-warning-border bg-warning-bg text-warning-text'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Exploração pública</CardTitle>
              <CardDescription>
                {isLoading
                  ? 'Carregando snapshot público mais recente...'
                  : `Snapshot semanal disponível: ${latestSnapshotWeek ?? 'indisponível'}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-text-secondary">
              <p>{resumo}</p>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Linha (opcional)
                </span>
                <input
                  value={linhaId}
                  onChange={(event) => setLinhaId(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-card-border bg-background px-3 py-2"
                  placeholder="Ex: DU10"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Período
                </span>
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-card-border bg-background px-3 py-2"
                >
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                </select>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Download sob demanda</CardTitle>
              <CardDescription>
                O download exige email para contato e rastreabilidade acadêmica mínima.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block space-y-1">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  <Mail size={14} aria-hidden="true" />
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-card-border bg-background px-3 py-2"
                  placeholder="pesquisa@ufmg.br"
                />
              </label>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void handleDownload('GeoJSON')}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 font-semibold text-text-inverse"
                >
                  <Download size={16} aria-hidden="true" />
                  GeoJSON
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownload('CSV')}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-card-border bg-background px-4 py-2 font-semibold text-text-primary"
                >
                  <Download size={16} aria-hidden="true" />
                  CSV
                </button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
