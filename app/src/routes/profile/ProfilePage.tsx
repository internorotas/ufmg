import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  AtSign,
  Bell,
  Bus,
  Eye,
  MapPin,
  Medal,
  Route,
  Settings,
  Trash2,
  Trophy,
  UserCircle2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/app/AppShell';
import { DataStatusScreen } from '@/components/app/DataStatusScreen';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner';
import { Input } from '@/components/ui/Input';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useNotificacaoContext } from '@/contexts/NotificacaoContext';
import { updateConsentState } from '@/features/auth/api/authClient';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { AchievementsGrid } from '@/features/gamification/components/AchievementsGrid';
import { ContributionHeatmap } from '@/features/gamification/components/ContributionHeatmap';
import { SupportActionsCard } from '@/features/monetization/components/SupportActionsCard';
import {
  deleteAccount,
  type ProfileUpdatePayload,
  toAuthenticatedUser,
  type UserProfile,
  updateProfile,
} from '@/features/profile/api/profileClient';
import { DeleteAccountDialog } from '@/features/profile/components/DeleteAccountDialog';
import { PROFILE_QUERY_KEY, useProfileQuery } from '@/features/profile/queries/useProfileQuery';
import { useHistoricoViagens } from '@/hooks/useHistoricoViagens';
import { formatDateTimePtBr } from '@/lib/formatters';

interface ProfileFeedbackState {
  type: 'success' | 'error';
  message: string;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { authStatus, isAuthenticated, updateUser, resetSession } = useAuthContext();
  const { logout, isPending: isLogoutPending } = useLogout();
  const { publishPointEvent } = useNotificacaoContext();
  const queryClient = useQueryClient();

  const { data: profile, isPending: isLoadingProfile, error } = useProfileQuery();
  const { historico } = useHistoricoViagens();
  const profileError =
    error instanceof Error ? error.message : error ? 'Falha ao carregar perfil.' : null;

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [feedback, setFeedback] = useState<ProfileFeedbackState | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  // Refs estáveis para evitar que funções de contexto com referência instável
  // disparem re-execuções desnecessárias do efeito de sincronização de perfil.
  const publishPointEventRef = useRef(publishPointEvent);
  const updateUserRef = useRef(updateUser);
  const lastShownEventRef = useRef<string | null>(null);
  useEffect(() => {
    publishPointEventRef.current = publishPointEvent;
  });
  useEffect(() => {
    updateUserRef.current = updateUser;
  });

  // Sincroniza auth context e notificação de pontos quando o dado do perfil chega ou atualiza.
  // Só publica o toast quando há um evento novo (earnedAt diferente do último exibido).
  useEffect(() => {
    if (!profile) return;
    updateUserRef.current(toAuthenticatedUser(profile));
    const latest = profile.gamification.recentPointEvents[0] ?? null;
    if (latest && latest.earnedAt !== lastShownEventRef.current) {
      lastShownEventRef.current = latest.earnedAt;
      publishPointEventRef.current(latest);
    }
  }, [profile]);

  // Sincroniza input de nickname com o perfil (na carga inicial e após salvar)
  useEffect(() => {
    if (profile) setNicknameInput(profile.nickname ?? '');
  }, [profile]);

  const handleProfileUpdate = useCallback(
    async (payload: ProfileUpdatePayload, onError?: (message: string) => void) => {
      if (!profile || isUpdatingProfile) {
        return;
      }

      setIsUpdatingProfile(true);
      setFeedback(null);

      try {
        const updated = await updateProfile(payload);
        queryClient.setQueryData<UserProfile>(PROFILE_QUERY_KEY, updated);
        updateUser(toAuthenticatedUser(updated));
        setFeedback({ type: 'success', message: 'Preferências de perfil atualizadas.' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao atualizar perfil.';
        if (onError) {
          onError(message);
        } else {
          setFeedback({ type: 'error', message });
        }
      } finally {
        setIsUpdatingProfile(false);
      }
    },
    [isUpdatingProfile, profile, queryClient, updateUser],
  );

  const nicknameChanged = nicknameInput !== (profile?.nickname ?? '');
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const handleSaveNickname = useCallback(async () => {
    setNicknameError(null);
    await handleProfileUpdate({ nickname: nicknameInput.trim() || null }, setNicknameError);
  }, [handleProfileUpdate, nicknameInput]);

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

  const handleToggleConsentGps = useCallback(async () => {
    if (!profile || isUpdatingProfile) return;
    setIsUpdatingProfile(true);
    setFeedback(null);
    try {
      const result = await updateConsentState({
        consentGps: !profile.consentGpsAt,
        consentResearch: !!profile.consentResearchAt,
      });
      // Usa o timestamp retornado pelo servidor (não um timestamp local) para
      // garantir que o estado local reflita exatamente o que foi persistido.
      queryClient.setQueryData<UserProfile>(PROFILE_QUERY_KEY, (prev) =>
        prev ? { ...prev, consentGpsAt: result.consentGpsAt } : prev,
      );
      setFeedback({ type: 'success', message: 'Consentimento GPS atualizado.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar consentimento.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsUpdatingProfile(false);
    }
  }, [isUpdatingProfile, profile, queryClient]);

  const handleToggleConsentResearch = useCallback(async () => {
    if (!profile || isUpdatingProfile) return;
    setIsUpdatingProfile(true);
    setFeedback(null);
    try {
      const result = await updateConsentState({
        consentGps: !!profile.consentGpsAt,
        consentResearch: !profile.consentResearchAt,
      });
      queryClient.setQueryData<UserProfile>(PROFILE_QUERY_KEY, (prev) =>
        prev ? { ...prev, consentResearchAt: result.consentResearchAt } : prev,
      );
      setFeedback({ type: 'success', message: 'Consentimento de pesquisa atualizado.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar consentimento.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsUpdatingProfile(false);
    }
  }, [isUpdatingProfile, profile, queryClient]);

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
      <div className="flex flex-col gap-4">
        {/* Cabeçalho com avatar e nome — sempre visível */}
        <header className="surface-card flex flex-wrap items-center gap-3 bg-card px-4 py-4 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {profile.avatarUrl && /^https?:\/\//i.test(profile.avatarUrl) ? (
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
              <p className="mt-1 text-xs text-text-secondary">
                Última atividade: {formatDateTimePtBr(profile.lastSeenAt)}
              </p>
            </div>
          </div>
          {/* Resumo rápido de pontos e streak */}
          <div className="flex shrink-0 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-text-primary tabular-nums">
                {profile.gamification.totalPoints}
              </p>
              <p className="text-xs text-text-secondary">pts</p>
            </div>
            <div className="w-px bg-card-border" />
            <div>
              <p className="text-lg font-bold text-text-primary tabular-nums">
                {profile.gamification.streakCurrentDays}
              </p>
              <p className="text-xs text-text-secondary">streak</p>
            </div>
          </div>
        </header>

        {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

        <Tabs defaultValue="atividade" className="gap-0">
          <TabsList variant="underline" fullWidth={false} className="overflow-x-auto px-1">
            <TabsTrigger value="atividade" className="gap-1.5">
              <Trophy size={14} aria-hidden="true" />
              Atividade
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="gap-1.5">
              <Settings size={14} aria-hidden="true" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="apoio" className="gap-1.5">
              <Medal size={14} aria-hidden="true" />
              Apoio
            </TabsTrigger>
            <TabsTrigger value="conta" className="gap-1.5">
              <AlertTriangle size={14} aria-hidden="true" />
              Conta
            </TabsTrigger>
          </TabsList>

          {/* ─── Atividade ─── */}
          <TabsContent value="atividade" className="mt-4 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy size={18} aria-hidden="true" />
                  Ranking e pontuação
                </CardTitle>
                <CardDescription>
                  Resumo real da sua contribuição e posição semanal.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <div className="surface-card-sm bg-background px-3 py-3">
                  <p className="text-xs font-semibold text-text-tertiary">Pontos totais</p>
                  <p className="mt-2 text-2xl font-bold text-text-primary">
                    {profile.gamification.totalPoints}
                  </p>
                </div>
                <div className="surface-card-sm bg-background px-3 py-3">
                  <p className="text-xs font-semibold text-text-tertiary">Ranking semanal</p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">{weeklyRankLabel}</p>
                </div>
                <div className="surface-card-sm bg-background px-3 py-3">
                  <p className="text-xs font-semibold text-text-tertiary">Streak</p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">
                    {profile.gamification.streakCurrentDays} dias agora
                  </p>
                  <p className="text-xs text-text-secondary">
                    Melhor: {profile.gamification.streakBestDays} dias
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
                  Emblemas desbloqueados, progresso e atividade dos últimos 30 dias.
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
                <div className="surface-card-sm space-y-2 bg-background px-3 py-3">
                  <h3 className="text-sm font-semibold text-text-primary">Eventos recentes</h3>
                  <div className="space-y-2 text-sm text-text-secondary">
                    {profile.gamification.recentPointEvents.length === 0 ? (
                      <p className="text-text-tertiary">Nenhum evento recente.</p>
                    ) : (
                      profile.gamification.recentPointEvents.map((event) => (
                        <p key={`${event.reason}-${event.earnedAt}`}>{event.message}</p>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            {historico.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Route size={18} aria-hidden="true" />
                    Histórico de viagens
                  </CardTitle>
                  <CardDescription>Últimas viagens registradas no servidor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {historico.slice(0, 10).map((viagem) => {
                    const durMs =
                      new Date(viagem.encerradoAt).getTime() -
                      new Date(viagem.iniciadoAt).getTime();
                    const durMin = Math.round(durMs / 60_000);
                    const km = viagem.displacementKm;
                    const distStr =
                      km == null
                        ? null
                        : km < 1
                          ? `${Math.round(km * 1000)} m`
                          : `${km.toFixed(1)} km`;
                    const data = new Date(viagem.encerradoAt);
                    const dataStr = data.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    });
                    const hora = data.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={viagem.id}
                        className="surface-card-sm flex items-center gap-3 bg-background px-3 py-2.5"
                      >
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: viagem.linhaCorHex ?? 'var(--text-tertiary)' }}
                          aria-hidden="true"
                        >
                          <Bus size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-text-primary">
                            {viagem.linhaNome ?? viagem.linhaId}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {distStr ? `${distStr} · ` : ''}
                            {durMin} min
                          </p>
                        </div>
                        <p className="shrink-0 text-xs text-text-tertiary">
                          {dataStr} {hora}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── Configurações ─── */}
          <TabsContent value="configuracoes" className="mt-4 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AtSign size={18} aria-hidden="true" />
                  Identificação
                </CardTitle>
                <CardDescription>
                  Nickname exibido no ranking e no seu perfil público.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={nicknameInput}
                    onChange={(e) => {
                      setNicknameInput(e.target.value);
                      setNicknameError(null);
                    }}
                    placeholder="sem nickname"
                    maxLength={40}
                    leftIcon={<AtSign size={14} aria-hidden="true" />}
                    disabled={isUpdatingProfile}
                    aria-label="Nickname"
                    className="flex-1"
                    error={Boolean(nicknameError)}
                    errorMessage={nicknameError ?? undefined}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!nicknameChanged || isUpdatingProfile}
                    onClick={() => void handleSaveNickname()}
                  >
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye size={18} aria-hidden="true" />
                  Privacidade e visibilidade
                </CardTitle>
                <CardDescription>
                  Controle do perfil público, marcador no mapa e detalhamento de ranking.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SwitchRow
                  label="Perfil público"
                  checked={profile.profilePublic}
                  onClick={handleToggleProfilePublic}
                  disabled={isUpdatingProfile}
                />
                <SwitchRow
                  label={
                    <span className="flex items-center gap-2">
                      <MapPin size={16} aria-hidden="true" />
                      Marcador no mapa
                    </span>
                  }
                  checked={profile.mapMarkerVisible}
                  onClick={handleToggleMapMarker}
                  disabled={isUpdatingProfile}
                />
                <ToggleRow
                  label="Detalhamento do ranking"
                  trailing={<Badge variant="info">{rankingDetailLabel}</Badge>}
                  onClick={handleCycleRankingDetail}
                  disabled={isUpdatingProfile}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell size={18} aria-hidden="true" />
                  Notificações e consentimento
                </CardTitle>
                <CardDescription>
                  Preferência de notificações e consentimento LGPD para dados de localização.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-text-tertiary">Perfil de notificação</p>
                  <select
                    value={profile.notificationProfile}
                    onChange={(e) =>
                      void handleProfileUpdate({
                        notificationProfile: e.target
                          .value as import('@/features/auth/api/authClient').NotificationProfile,
                      })
                    }
                    disabled={isUpdatingProfile}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
                  >
                    <option value="minimo">Mínimo</option>
                    <option value="normal">Normal</option>
                    <option value="tudo">Tudo</option>
                  </select>
                </div>

                <SwitchRow
                  label={
                    <span className="flex items-center gap-2">
                      <MapPin size={16} aria-hidden="true" />
                      Compartilhar localização
                    </span>
                  }
                  checked={!!profile.consentGpsAt}
                  onClick={() => void handleToggleConsentGps()}
                  disabled={isUpdatingProfile}
                />

                <div className="surface-card-sm bg-background px-3 py-2 text-xs text-text-secondary">
                  Ao usar o app, você contribui com dados de localização por padrão. Isso melhora as
                  informações em tempo real para todos os usuários. Você pode desativar a qualquer
                  momento usando o botão acima.
                </div>

                <SwitchRow
                  label="Consentimento pesquisa"
                  checked={!!profile.consentResearchAt}
                  onClick={() => void handleToggleConsentResearch()}
                  disabled={isUpdatingProfile}
                />

                <div className="surface-card-sm bg-background px-3 py-2 text-sm text-text-secondary">
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
          </TabsContent>

          {/* ─── Apoio ─── */}
          <TabsContent value="apoio" className="mt-4">
            <SupportActionsCard monetization={profile.monetization} />
          </TabsContent>

          {/* ─── Conta ─── */}
          <TabsContent value="conta" className="mt-4">
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
                  leftIcon={<Trash2 size={16} aria-hidden="true" />}
                >
                  Solicitar exclusão de conta
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
