import { AlertTriangle, Bell, Eye, EyeOff, MapPin, Medal, Trophy, UserCircle2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/app/AppShell';
import { DataStatusScreen } from '@/components/app/DataStatusScreen';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useNotificacaoContext } from '@/contexts/NotificacaoContext';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { AchievementsGrid } from '@/features/gamification/components/AchievementsGrid';
import { ContributionHeatmap } from '@/features/gamification/components/ContributionHeatmap';
import { SupportActionsCard } from '@/features/monetization/components/SupportActionsCard';
import {
  deleteAccount,
  getProfile,
  type ProfileUpdatePayload,
  toAuthenticatedUser,
  type UserProfile,
  updateProfile,
} from '@/features/profile/api/profileClient';
import { DeleteAccountDialog } from '@/features/profile/components/DeleteAccountDialog';

interface ProfileFeedbackState {
  type: 'success' | 'error';
  message: string;
}

function formatConsent(consentAt: string | null): string {
  if (!consentAt) {
    return 'Não concedido';
  }

  return new Date(consentAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLastSeen(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { authStatus, isAuthenticated, updateUser, resetSession } = useAuthContext();
  const { logout, isPending: isLogoutPending } = useLogout();
  const { publishPointEvent } = useNotificacaoContext();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ProfileFeedbackState | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setProfileError(null);

      try {
        const response = await getProfile();
        if (!isMounted) {
          return;
        }

        setProfile(response);
        updateUser(toAuthenticatedUser(response));
        publishPointEvent(response.gamification.recentPointEvents[0] ?? null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Falha ao carregar perfil.';
        setProfileError(message);
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, publishPointEvent, updateUser]);

  const handleProfileUpdate = useCallback(
    async (payload: ProfileUpdatePayload) => {
      if (!profile || isUpdatingProfile) {
        return;
      }

      setIsUpdatingProfile(true);
      setFeedback(null);

      try {
        const updated = await updateProfile(payload);
        setProfile(updated);
        updateUser(toAuthenticatedUser(updated));
        setFeedback({ type: 'success', message: 'Preferências de perfil atualizadas.' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao atualizar perfil.';
        setFeedback({ type: 'error', message });
      } finally {
        setIsUpdatingProfile(false);
      }
    },
    [isUpdatingProfile, profile, updateUser],
  );

  const handleToggleProfilePublic = useCallback(() => {
    if (!profile) {
      return;
    }

    void handleProfileUpdate({ profilePublic: !profile.profilePublic });
  }, [handleProfileUpdate, profile]);

  const handleToggleMapMarker = useCallback(() => {
    if (!profile) {
      return;
    }

    void handleProfileUpdate({ mapMarkerVisible: !profile.mapMarkerVisible });
  }, [handleProfileUpdate, profile]);

  const handleCycleRankingDetail = useCallback(() => {
    if (!profile) {
      return;
    }

    const nextRankingDetail = profile.rankingDetail === 'geral' ? 'por_linha' : 'geral';
    void handleProfileUpdate({ rankingDetail: nextRankingDetail });
  }, [handleProfileUpdate, profile]);

  const handleCycleNotificationProfile = useCallback(() => {
    if (!profile) {
      return;
    }

    const sequence: Array<UserProfile['notificationProfile']> = ['minimo', 'normal', 'tudo'];
    const currentIndex = sequence.indexOf(profile.notificationProfile);
    const nextIndex = (currentIndex + 1) % sequence.length;
    const nextNotificationProfile = sequence[nextIndex] ?? 'normal';
    void handleProfileUpdate({ notificationProfile: nextNotificationProfile });
  }, [handleProfileUpdate, profile]);

  const handleLogout = useCallback(async () => {
    setFeedback(null);

    try {
      await logout();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao encerrar sessão.';
      setFeedback({ type: 'error', message });
    }
  }, [logout]);

  const handleDeleteAccount = useCallback(async () => {
    if (isDeletingAccount) {
      return;
    }

    setIsDeletingAccount(true);
    setFeedback(null);

    try {
      const result = await deleteAccount();
      setIsDeleteDialogOpen(false);
      resetSession();
      navigate('/', {
        replace: true,
        state: {
          authFeedback: `Solicitação de exclusão registrada (${result.protocol}). Prazo máximo: 30 dias.`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao solicitar exclusão.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsDeletingAccount(false);
    }
  }, [isDeletingAccount, navigate, resetSession]);

  const rankingDetailLabel = useMemo(() => {
    if (!profile) {
      return 'geral';
    }

    return profile.rankingDetail === 'geral' ? 'Ranking geral' : 'Ranking por linha';
  }, [profile]);

  const notificationProfileLabel = useMemo(() => {
    if (!profile) {
      return 'Normal';
    }

    if (profile.notificationProfile === 'minimo') {
      return 'Mínimo';
    }

    if (profile.notificationProfile === 'tudo') {
      return 'Tudo';
    }

    return 'Normal';
  }, [profile]);

  const weeklyRankLabel = useMemo(() => {
    if (!profile) {
      return 'Sem posição semanal ainda';
    }
    if (!profile.gamification.weeklyRank) {
      return 'Sem posição semanal ainda';
    }
    return `#${profile.gamification.weeklyRank} em ${profile.gamification.weeklyRankScope}`;
  }, [profile]);

  if (authStatus === 'booting') {
    return (
      <DataStatusScreen
        title="Validando sessão"
        description="Conferindo sua autenticação antes de abrir o perfil..."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isLoadingProfile) {
    return (
      <DataStatusScreen
        title="Carregando perfil"
        description="Buscando suas preferências e status de consentimento..."
      />
    );
  }

  if (profileError || !profile) {
    return (
      <DataStatusScreen
        title="Falha ao carregar perfil"
        description={profileError ?? 'Não foi possível carregar os dados de perfil.'}
        variant="warning"
      />
    );
  }

  return (
    <AppShell title="Perfil" description={profile.displayName}>
      <div className="flex flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-card-border bg-card px-4 py-4 shadow-sm sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`Avatar de ${profile.displayName}`}
                className="size-14 rounded-full border border-card-border object-cover"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-full border border-card-border bg-background-secondary text-brand-primary">
                <UserCircle2 size={30} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold sm:text-2xl">{profile.displayName}</h2>
              <p className="truncate text-sm text-text-secondary">
                {profile.nickname ? `@${profile.nickname}` : 'Sem nickname configurado'}
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                Última atividade: {formatLastSeen(profile.lastSeenAt)}
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

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye size={18} aria-hidden="true" />
                Privacidade e visibilidade
              </CardTitle>
              <CardDescription>
                Controle separado para perfil público, marcador no mapa e detalhamento de ranking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between rounded-lg border border-card-border bg-background px-3 py-2 text-left hover:bg-card-hover"
                onClick={handleToggleProfilePublic}
                disabled={isUpdatingProfile}
              >
                <span className="text-sm font-medium">Perfil público</span>
                <Badge variant={profile.profilePublic ? 'success' : 'neutral'}>
                  {profile.profilePublic ? 'Ativo' : 'Oculto'}
                </Badge>
              </button>

              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between rounded-lg border border-card-border bg-background px-3 py-2 text-left hover:bg-card-hover"
                onClick={handleToggleMapMarker}
                disabled={isUpdatingProfile}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <MapPin size={16} aria-hidden="true" />
                  Marcador no mapa
                </span>
                <Badge variant={profile.mapMarkerVisible ? 'success' : 'neutral'}>
                  {profile.mapMarkerVisible ? 'Visível' : 'Oculto'}
                </Badge>
              </button>

              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between rounded-lg border border-card-border bg-background px-3 py-2 text-left hover:bg-card-hover"
                onClick={handleCycleRankingDetail}
                disabled={isUpdatingProfile}
              >
                <span className="text-sm font-medium">Detalhamento do ranking</span>
                <Badge variant="info">{rankingDetailLabel}</Badge>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell size={18} aria-hidden="true" />
                Notificações e consentimento
              </CardTitle>
              <CardDescription>
                Estado atual de consentimento LGPD e preferência de notificações, incluindo eventos
                colaborativos da Fase 7.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between rounded-lg border border-card-border bg-background px-3 py-2 text-left hover:bg-card-hover"
                onClick={handleCycleNotificationProfile}
                disabled={isUpdatingProfile}
              >
                <span className="text-sm font-medium">Perfil de notificação</span>
                <Badge variant="info">{notificationProfileLabel}</Badge>
              </button>

              <div className="rounded-lg border border-card-border bg-background px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Consentimento GPS
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {formatConsent(profile.consentGpsAt)}
                </p>
              </div>

              <div className="rounded-lg border border-card-border bg-background px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Consentimento pesquisa
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {formatConsent(profile.consentResearchAt)}
                </p>
              </div>

              <div className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-text-secondary">
                <p className="font-medium text-text-primary">
                  Eventos colaborativos ativos neste perfil
                </p>
                <p className="mt-1">
                  Viagem encerrada automaticamente, pedido de avaliação pós-viagem, alerta de
                  serviço aprovado e risco de streak usam esta preferência.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <SupportActionsCard monetization={profile.monetization} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy size={18} aria-hidden="true" />
                Ranking e pontuação
              </CardTitle>
              <CardDescription>Resumo real da sua contribuição e posição semanal.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-card-border bg-background px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Pontos totais
                </p>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {profile.gamification.totalPoints}
                </p>
              </div>
              <div className="rounded-lg border border-card-border bg-background px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Ranking semanal
                </p>
                <p className="mt-2 text-sm font-semibold text-text-primary">{weeklyRankLabel}</p>
              </div>
              <div className="rounded-lg border border-card-border bg-background px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Streak
                </p>
                <p className="mt-2 text-sm font-semibold text-text-primary">
                  {profile.gamification.streakCurrentDays} dias agora
                </p>
                <p className="text-xs text-text-secondary">
                  Melhor sequência: {profile.gamification.streakBestDays} dias
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Medal size={18} aria-hidden="true" />
                Emblemas e histórico
              </CardTitle>
              <CardDescription>
                Emblemas desbloqueados, progresso atual e atividade dos últimos 30 dias.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <AchievementsGrid
                unlocked={profile.gamification.achievementsUnlocked}
                locked={profile.gamification.achievementsLocked}
              />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text-primary">
                  Ritmo dos últimos 30 dias
                </h3>
                <ContributionHeatmap history={profile.gamification.contributionHistory30d} />
              </div>
              <div className="space-y-2 rounded-lg border border-card-border bg-background px-3 py-3">
                <h3 className="text-sm font-semibold text-text-primary">Eventos recentes</h3>
                <div className="space-y-2 text-sm text-text-secondary">
                  {profile.gamification.recentPointEvents.map((event) => (
                    <p key={`${event.reason}-${event.earnedAt}`}>{event.message}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle size={18} aria-hidden="true" />
              Sessão e conta
            </CardTitle>
            <CardDescription>
              Encerre sua sessão atual ou solicite exclusão da conta conforme LGPD.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={isLogoutPending || isDeletingAccount}
              onClick={() => void handleLogout()}
            >
              Encerrar sessão
            </Button>
            <Button
              type="button"
              variant="danger"
              className="min-h-11"
              disabled={isLogoutPending || isDeletingAccount}
              onClick={() => setIsDeleteDialogOpen(true)}
              leftIcon={profile.profilePublic ? <EyeOff size={16} aria-hidden="true" /> : undefined}
            >
              Solicitar exclusão de conta
            </Button>
          </CardContent>
        </Card>
      </div>

      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        isPending={isDeletingAccount}
      />
    </AppShell>
  );
}
