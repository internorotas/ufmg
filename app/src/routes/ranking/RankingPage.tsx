import { Medal, Shield, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useNotificacaoContext } from '@/contexts/NotificacaoContext';
import { startGoogleLoginFlow } from '@/features/auth/api/authClient';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import {
  type AuthenticatedRankingResponse,
  getAuthenticatedRanking,
  getPublicRanking,
  type PublicRankingResponse,
  type RankingPeriod,
  type RankingScope,
} from '@/features/gamification/api/rankingClient';

const PERIOD_OPTIONS: RankingPeriod[] = ['semanal', 'mensal', 'all_time'];
const SCOPE_OPTIONS: RankingScope[] = ['geral', 'campus', 'linha:2004A'];

export function RankingPage() {
  const { isAuthenticated } = useAuthContext();
  const { collaborativeFeedback } = useNotificacaoContext();
  const [period, setPeriod] = useState<RankingPeriod>('semanal');
  const [scope, setScope] = useState<RankingScope>('geral');
  const [publicRanking, setPublicRanking] = useState<PublicRankingResponse | null>(null);
  const [privateRanking, setPrivateRanking] = useState<AuthenticatedRankingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);

    void getPublicRanking({ period, scope })
      .then((response) => {
        if (active) {
          setPublicRanking(response);
        }
      })
      .catch((currentError) => {
        if (active) {
          setError(
            currentError instanceof Error ? currentError.message : 'Falha ao carregar ranking.',
          );
        }
      });

    if (!isAuthenticated) {
      setPrivateRanking(null);
      return () => {
        active = false;
      };
    }

    void getAuthenticatedRanking({ period, scope })
      .then((response) => {
        if (active) {
          setPrivateRanking(response);
        }
      })
      .catch((currentError) => {
        if (active) {
          setError(
            currentError instanceof Error
              ? currentError.message
              : 'Falha ao carregar ranking autenticado.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, period, scope]);

  const entries = useMemo(() => {
    if (isAuthenticated && privateRanking) {
      return privateRanking.entries;
    }
    return publicRanking?.top ?? [];
  }, [isAuthenticated, privateRanking, publicRanking]);

  return (
    <main className="min-h-dvh bg-background-secondary px-4 py-6 text-text-primary sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="rounded-xl border border-card-border bg-card px-5 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Trophy size={20} aria-hidden="true" />
                <h1 className="text-2xl font-bold">Ranking colaborativo</h1>
              </div>
              <p className="max-w-2xl text-sm text-text-secondary">
                Top 10 público para leitura livre e visão completa para usuários autenticados.
                Pontos continuam apenas como incentivo, sem desbloqueio funcional do app.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-card-border px-4 text-sm font-semibold text-text-primary hover:bg-card-hover"
              >
                Voltar ao mapa
              </Link>
              {!isAuthenticated ? (
                <Button
                  type="button"
                  className="min-h-11"
                  onClick={() => void startGoogleLoginFlow()}
                >
                  Entrar para ver completo
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        {collaborativeFeedback ? (
          <div className="rounded-xl border border-info-border bg-card px-4 py-3 text-sm text-text-primary">
            {collaborativeFeedback}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-text">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Filtros do ranking</CardTitle>
              <CardDescription>
                Usuários anônimos podem navegar pelo teaser/top 10 sem login.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Período
                </p>
                <div className="flex flex-wrap gap-2">
                  {PERIOD_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPeriod(item)}
                      className={`min-h-11 rounded-full border px-3 text-sm font-semibold ${
                        period === item
                          ? 'border-brand-primary bg-brand-primary text-text-inverse'
                          : 'border-card-border bg-background text-text-secondary'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Escopo
                </p>
                <div className="flex flex-wrap gap-2">
                  {SCOPE_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setScope(item)}
                      className={`min-h-11 rounded-full border px-3 text-sm font-semibold ${
                        scope === item
                          ? 'border-brand-primary bg-brand-primary text-text-inverse'
                          : 'border-card-border bg-background text-text-secondary'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              {!isAuthenticated ? (
                <div className="rounded-xl border border-card-border bg-background px-3 py-3 text-sm text-text-secondary">
                  <p className="font-semibold text-text-primary">Top 10 público</p>
                  <p className="mt-1">
                    A consulta do ranking público não exige login e não bloqueia mapa, linhas,
                    paradas ou ETA.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isAuthenticated ? 'Ranking completo' : 'Top 10 público'}</CardTitle>
              <CardDescription>
                {isAuthenticated
                  ? 'Somente display name e pontuação de terceiros continuam visíveis.'
                  : 'Teaser público com 10 posições e sem dados pessoais extras.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {entries.map((entry, index) => (
                <div
                  key={`${entry.displayName}-${entry.score}`}
                  className="flex items-center justify-between rounded-xl border border-card-border bg-background px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full border border-card-border bg-card">
                      {index === 0 ? (
                        <Trophy size={16} aria-hidden="true" />
                      ) : (
                        <Medal size={16} aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        #{index + 1} {entry.displayName}
                      </p>
                      <p className="text-xs text-text-secondary">Pontuação pública mínima</p>
                    </div>
                  </div>
                  <Badge variant={index === 0 ? 'ouro' : 'prata'}>{entry.score} pts</Badge>
                </div>
              ))}

              {isAuthenticated && privateRanking?.currentUser ? (
                <div className="rounded-xl border border-info-border bg-info-bg px-4 py-3 text-sm text-info-text">
                  <div className="flex items-center gap-2 font-semibold">
                    <Shield size={16} aria-hidden="true" />
                    Sua posição atual
                  </div>
                  <p className="mt-1">
                    {privateRanking.currentUser.displayName}: #{privateRanking.currentUser.rank} com{' '}
                    {privateRanking.currentUser.score} pts.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
