import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Globe, LogOut, ShieldAlert, UserCircle2 } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useLogout } from '@/features/auth/hooks/useLogout';
import {
  toAuthenticatedUser,
  type UserProfile,
  updateProfile,
} from '@/features/profile/api/profileClient';
import { PROFILE_QUERY_KEY, useProfileQuery } from '@/features/profile/queries/useProfileQuery';
import { formatConsent } from '@/lib/formatters';

interface ProfileSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSheet({ isOpen, onOpenChange }: ProfileSheetProps) {
  const { user, updateUser } = useAuthContext();
  const { logout, isPending: isLogoutPending } = useLogout();
  const queryClient = useQueryClient();

  const { data: profile, isPending: isLoading } = useProfileQuery();

  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const headingId = useId();

  const userDisplay = useMemo(() => {
    if (profile) {
      return {
        displayName: profile.displayName,
        nickname: profile.nickname,
        avatarUrl: profile.avatarUrl,
      };
    }

    return {
      displayName: user?.displayName ?? 'Usuário',
      nickname: user?.nickname ?? null,
      avatarUrl: user?.avatarUrl ?? null,
    };
  }, [profile, user]);

  const handleTogglePublicProfile = async () => {
    if (!profile || isTogglingPublic) {
      return;
    }

    setIsTogglingPublic(true);
    setErrorMessage(null);

    try {
      const updated = await updateProfile({ profilePublic: !profile.profilePublic });
      queryClient.setQueryData<UserProfile>(PROFILE_QUERY_KEY, updated);
      updateUser(toAuthenticatedUser(updated));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao atualizar visibilidade do perfil.';
      setErrorMessage(message);
    } finally {
      setIsTogglingPublic(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onOpenChange(false);
    } catch {
      setErrorMessage('Falha ao encerrar sessão. Tente novamente.');
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup
          size="sm"
          className="fixed inset-x-0 bottom-0 top-auto max-h-[88dvh] w-full max-w-none rounded-b-none rounded-t-2xl"
          aria-labelledby={headingId}
        >
          <div className="flex items-center justify-between border-b border-card-border bg-background-secondary px-4 py-3">
            <h2 id={headingId} className="text-base font-semibold text-text-primary">
              Perfil rápido
            </h2>
            <Dialog.Close aria-label="Fechar perfil rápido" className="min-h-11 min-w-11" />
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            <div className="flex items-center gap-3 surface-card bg-card p-3">
              {userDisplay.avatarUrl && /^https?:\/\//i.test(userDisplay.avatarUrl) ? (
                <img
                  src={userDisplay.avatarUrl}
                  alt={`Avatar de ${userDisplay.displayName}`}
                  className="size-12 rounded-full border border-card-border object-cover"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full border border-card-border bg-background-secondary text-brand-primary dark:text-brand-accent">
                  <UserCircle2 size={26} aria-hidden="true" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {userDisplay.displayName}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {userDisplay.nickname ? `@${userDisplay.nickname}` : 'Sem nickname'}
                </p>
              </div>
              <Badge variant={(profile?.profilePublic ?? true) ? 'success' : 'neutral'}>
                {(profile?.profilePublic ?? true) ? 'Público' : 'Privado'}
              </Badge>
            </div>

            {errorMessage ? (
              <FeedbackBanner message={errorMessage} className="rounded-lg text-xs" />
            ) : null}

            <div className="surface-card bg-card p-3">
              <p className="mb-2 text-xs font-semibold text-text-tertiary">Consentimento LGPD</p>
              <p className="text-sm text-text-secondary">
                GPS:{' '}
                {profile ? formatConsent(profile.consentGpsAt) : isLoading ? 'Carregando...' : '—'}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Pesquisa:{' '}
                {profile
                  ? formatConsent(profile.consentResearchAt)
                  : isLoading
                    ? 'Carregando...'
                    : '—'}
              </p>
            </div>

            <div className="surface-card bg-card p-3">
              <ToggleRow
                label={
                  <span className="flex items-center gap-2 text-text-primary">
                    <Globe size={16} aria-hidden="true" />
                    Perfil público
                  </span>
                }
                trailing={
                  <Badge variant={profile?.profilePublic ? 'success' : 'neutral'}>
                    {profile?.profilePublic ? 'Ativo' : 'Oculto'}
                  </Badge>
                }
                onClick={() => void handleTogglePublicProfile()}
                disabled={!profile || isTogglingPublic}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link
                to="/perfil"
                onClick={() => onOpenChange(false)}
                className="flex min-h-11 items-center justify-between surface-card-interactive bg-card px-3 py-2 text-sm font-medium text-text-primary"
              >
                <span>Ir para /perfil</span>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>

              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={isLogoutPending}
                onClick={() => void handleLogout()}
                leftIcon={<LogOut size={16} aria-hidden="true" />}
              >
                Sair da conta
              </Button>
            </div>

            <div className="rounded-xl border border-warning-border/50 bg-warning-bg/50 px-3 py-2 text-xs text-warning-text">
              <p className="flex items-center gap-1 font-medium">
                <ShieldAlert size={14} aria-hidden="true" />
                Fluxo seguro
              </p>
              <p className="mt-1">
                Logout invalida sessão no backend e limpa token em memória sem recarregar a página.
              </p>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
