import { Medal, Shield, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/app/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner';
import { useNotificacaoContext } from '@/contexts/NotificacaoContext';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import {
  type AuthenticatedRankingResponse,
  getAuthenticatedRanking,
  getPublicRanking,
  type PublicRankingResponse,
  type RankingPeriod,
  type RankingScope,
} from '@/features/gamification/api/rankingClient';
import { useMounted } from '@/hooks/useMounted';

const PERIOD_OPTIONS: { value: RankingPeriod; label: string }[] = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'all_time', label: 'Todos os tempos' },
];

function MedalIcon({ position }: { position: number }) {
  if (position === 0) {
    return (
      <div className="flex size-9 items-center justify-center rounded-full bg-gamification-ouro-bg border border-gamification-ouro-border">
        <Trophy size={16} className="text-gamification-ouro-text" aria-hidden="true" />
      </div>
    );
  }
  if (position === 1) {
    return (
      <div className="flex size-9 items-center justify-center rounded-full bg-gamification-prata-bg border border-gamification-prata-border">
        <Medal size={16} className="text-gamification-prata-text" aria-hidden="true" />
      </div>
    );
  }
  if (position === 2) {
    return (
      <div className="flex size-9 items-center justify-center rounded-full bg-gamification-bronze-bg border border-gamification-bronze-border">
        <Medal size={16} className="text-gamification-bronze-text" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="flex size-9 items-center justify-center rounded-full border border-card-border bg-background-secondary">
      <span className="text-xs font-bold text-text-secondary">#{position + 1}</span>
    </div>
  );
}

function ScoreBadge({ score, position }: { score: number; position: number }) {
  if (position === 0) {
    return (
      <span className="rounded-(--shape-xs) border border-gamification-ouro-border bg-gamification-ouro-bg px-2 py-0.5 text-xs font-bold text-gamification-ouro-text">
        {score} pts
      </span>
    );
  }
  if (position === 1) {
    return (
      <span className="rounded-(--shape-xs) border border-gamification-prata-border bg-gamification-prata-bg px-2 py-0.5 text-xs font-bold text-gamification-prata-text">
        {score} pts
      </span>
    );
  }
  if (position === 2) {
    return (
      <span className="rounded-(--shape-xs) border border-gamification-bronze-border bg-gamification-bronze-bg px-2 py-0.5 text-xs font-bold text-gamification-bronze-text">
        {score} pts
      </span>
    );
  }
  return (
    <span className="rounded-(--shape-xs) border border-card-border bg-background-secondary px-2 py-0.5 text-xs font-semibold text-text-secondary">
      {score} pts
    </span>
  );
}

export function RankingPage() {
  const { isAuthenticated } = useAuthContext();
  const { collaborativeFeedback } = useNotificacaoContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [period, setPeriod] = useState<RankingPeriod>('semanal');
  const scope: RankingScope = 'geral';
  const [publicRanking, setPublicRanking] = useState<PublicRankingResponse | null>(null);
  const [privateRanking, setPrivateRanking] = useState<AuthenticatedRankingResponse | null>(null);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useMounted();

  useEffect(() => {
    const fetchAll = () => {
      setPublicError(null);
      setIsLoading(true);

      void getPublicRanking({ period, scope })
        .then((response) => {
          if (isMounted()) {
            setPublicRanking(response);
            setIsLoading(false);
          }
        })
        .catch((currentError: unknown) => {
          if (isMounted()) {
            setPublicError(
              currentError instanceof Error
                ? currentError.message
                : 'Falha ao carregar ranking público.',
            );
            setIsLoading(false);
          }
        });

      if (!isAuthenticated) {
        setPrivateRanking(null);
        return;
      }

      void getAuthenticatedRanking({ period, scope })
        .then((response) => {
          if (isMounted()) setPrivateRanking(response);
        })
        .catch(() => {
          if (isMounted()) setPrivateRanking(null);
        });
    };

    fetchAll();

    if (!isAuthenticated) return;

    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [isAuthenticated, isMounted, period]);

  const entries = useMemo(() => {
    if (isAuthenticated && privateRanking) {
      return privateRanking.entries;
    }
    return publicRanking?.top ?? [];
  }, [isAuthenticated, privateRanking, publicRanking]);

  return (
    <AppShell
      title="Ranking colaborativo"
      description="Top 10 público com visão completa para autenticados"
      actions={
        !isAuthenticated ? (
          <Button
            type="button"
            className="min-h-11"
            onClick={() => navigate('/login', { state: { from: location.pathname } })}
          >
            Entrar para ver completo
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-5">
        <header className="rounded-(--shape-sm) border border-card-border bg-card px-5 py-4 shadow-(--elevation-1)">
          <div className="flex items-center gap-2 text-text-secondary">
            <Trophy size={18} aria-hidden="true" className="shrink-0 text-brand-primary" />
            <p className="text-sm">
              Top 10 público, sem login. Pontos são só incentivo, não há paywall.
            </p>
          </div>
        </header>

        {collaborativeFeedback ? (
          <div className="rounded-(--shape-sm) border border-card-border bg-card px-4 py-3 text-sm text-text-primary shadow-(--elevation-1)">
            {collaborativeFeedback}
          </div>
        ) : null}

        {publicError ? <FeedbackBanner message={publicError} /> : null}

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>
                Usuários anônimos podem navegar pelo top 10 sem login.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-tertiary">Período</p>
                <div className="flex flex-wrap gap-2">
                  {PERIOD_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPeriod(item.value)}
                      className={`min-h-10 rounded-(--shape-sm) border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                        period === item.value
                          ? 'border-brand-primary bg-brand-primary text-text-inverse'
                          : 'border-card-border bg-background text-text-secondary hover:bg-card-hover hover:text-text-primary'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              {!isAuthenticated ? (
                <div className="rounded-(--shape-sm) border border-info-border bg-info-bg px-3 py-3 text-sm">
                  <p className="font-semibold text-info-text">Top 10 público</p>
                  <p className="mt-1 text-info-text/80">
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
            <CardContent className="space-y-2">
              {isLoading ? (
                <p className="py-4 text-center text-sm text-text-secondary">Carregando...</p>
              ) : entries.length === 0 ? (
                <p className="py-4 text-center text-sm text-text-secondary">
                  Nenhuma entrada no ranking ainda.
                </p>
              ) : (
                entries.map((entry, index) => (
                  <div
                    key={entry.displayName}
                    className={`flex items-center justify-between gap-3 rounded-(--shape-sm) border px-3 py-2.5 transition-colors ${
                      index === 0
                        ? 'border-gamification-ouro-border bg-gamification-ouro-bg/30'
                        : index === 1
                          ? 'border-gamification-prata-border bg-gamification-prata-bg/30'
                          : index === 2
                            ? 'border-gamification-bronze-border bg-gamification-bronze-bg/30'
                            : 'border-card-border bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MedalIcon position={index} />
                      <p className="text-sm font-semibold text-text-primary">{entry.displayName}</p>
                    </div>
                    <ScoreBadge score={entry.score} position={index} />
                  </div>
                ))
              )}

              {isAuthenticated && privateRanking?.currentUser ? (
                <div className="mt-2 rounded-(--shape-sm) border border-info-border bg-info-bg px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-info-text">
                    <Shield size={16} aria-hidden="true" />
                    Sua posição atual
                  </div>
                  <p className="mt-1 text-info-text/80">
                    {privateRanking.currentUser.displayName}: #{privateRanking.currentUser.rank} com{' '}
                    {privateRanking.currentUser.score} pts.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
