import type {
  AuthenticatedUser,
  NotificationProfile,
  RankingDetail,
} from '@/features/auth/api/authClient';
import { getAuthHeaders, resolveAuthEndpoint } from '@/features/auth/api/authClient';

export interface UserProfile {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  nickname: string | null;
  profilePublic: boolean;
  mapMarkerVisible: boolean;
  rankingDetail: RankingDetail;
  notificationProfile: NotificationProfile;
  consentGps: boolean;
  consentResearch: boolean;
  consentGpsAt: string | null;
  consentResearchAt: string | null;
  lastSeenAt: string;
}

export interface ProfileUpdatePayload {
  displayName?: string;
  nickname?: string | null;
  profilePublic?: boolean;
  mapMarkerVisible?: boolean;
  rankingDetail?: RankingDetail;
  notificationProfile?: NotificationProfile;
}

export interface AccountDeletionRequestResult {
  protocol: string;
  status: 'pending';
  requestedAt: string;
  dueAt: string;
}

interface ProfileResponse extends UserProfile {}

function buildAuthenticatedHeaders(extraHeaders?: HeadersInit): HeadersInit {
  const authHeaders = getAuthHeaders();
  if (!authHeaders) {
    throw new Error('Sessão autenticada ausente');
  }

  return {
    ...(authHeaders as Record<string, string>),
    ...(extraHeaders as Record<string, string> | undefined),
  };
}

export async function getProfile(): Promise<UserProfile> {
  const response = await fetch(resolveAuthEndpoint('/v1/auth/profile'), {
    method: 'GET',
    cache: 'no-store',
    headers: buildAuthenticatedHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar perfil: HTTP ${response.status}`);
  }

  return response.json() as Promise<ProfileResponse>;
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<UserProfile> {
  const response = await fetch(resolveAuthEndpoint('/v1/auth/profile'), {
    method: 'PATCH',
    cache: 'no-store',
    headers: buildAuthenticatedHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Falha ao atualizar perfil: HTTP ${response.status}`);
  }

  return response.json() as Promise<ProfileResponse>;
}

export async function logout(): Promise<void> {
  const response = await fetch(resolveAuthEndpoint('/v1/auth/logout'), {
    method: 'POST',
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders() ?? undefined,
  });

  if (!response.ok) {
    throw new Error(`Falha ao encerrar sessão: HTTP ${response.status}`);
  }
}

export async function deleteAccount(): Promise<AccountDeletionRequestResult> {
  const response = await fetch(resolveAuthEndpoint('/v1/auth/delete-account'), {
    method: 'POST',
    cache: 'no-store',
    credentials: 'include',
    headers: buildAuthenticatedHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Falha ao solicitar exclusão de conta: HTTP ${response.status}`);
  }

  return response.json() as Promise<AccountDeletionRequestResult>;
}

export function toAuthenticatedUser(profile: UserProfile): AuthenticatedUser {
  return {
    id: profile.id,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    nickname: profile.nickname,
  };
}
