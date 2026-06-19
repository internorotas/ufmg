/**
 * pages.stories.tsx
 *
 * Ladle stories for page-level route components:
 *   - LoginPage
 *   - AboutPage
 *   - RankingPage
 *   - ProfilePage
 *
 * Each story is self-contained. API calls are intercepted by overriding
 * global fetch or by pre-seeding the React Query cache so no real network
 * requests are made.
 */

import type { Story } from '@ladle/react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';

// Auth store — mutated directly to control auth state per story
import { useAuthStore } from '@/features/auth/store/authStore';
import type {
  AuthenticatedRankingResponse,
  PublicRankingResponse,
} from '@/features/gamification/api/rankingClient';
// Types
import type { UserProfile } from '@/features/profile/api/profileClient';
// Profile query key (used when pre-seeding cache)
import { PROFILE_QUERY_KEY } from '@/features/profile/queries/useProfileQuery';
import { AboutPage } from '@/routes/about/AboutPage';
// Pages under test
import { LoginPage } from '@/routes/login/LoginPage';
import { ProfilePage } from '@/routes/profile/ProfilePage';
import { RankingPage } from '@/routes/ranking/RankingPage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  });
}

/** Wraps a story with everything pages need: router + query client. */
function PageWrapper({
  children,
  initialPath = '/',
}: {
  children: React.ReactNode;
  initialPath?: string;
}) {
  return (
    <MemoryRouter initialEntries={[initialPath]} initialIndex={0}>
      {children}
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Mock data fixtures
// ---------------------------------------------------------------------------

const MOCK_PROFILE: UserProfile = {
  id: 42,
  displayName: 'Ana Beatriz Oliveira',
  avatarUrl: null,
  nickname: 'anabeatriz',
  profilePublic: true,
  mapMarkerVisible: true,
  rankingDetail: 'geral',
  notificationProfile: 'normal',
  consentGps: true,
  consentResearch: false,
  consentGpsAt: '2025-03-15T10:00:00Z',
  consentResearchAt: null,
  lastSeenAt: '2026-06-19T08:30:00Z',
  gamification: {
    totalPoints: 3_720,
    weeklyRank: 5,
    weeklyRankScope: 'geral',
    streakCurrentDays: 12,
    streakBestDays: 28,
    achievementsUnlocked: [
      {
        slug: 'primeiro-relato',
        nome: 'Primeiro Relato',
        descricao: 'Enviou o primeiro relato colaborativo.',
        rarity: 'common',
        category: 'global',
        isReserved: false,
        criteriaText: 'Envie 1 relato.',
        progressPercent: 100,
        unlockedAt: '2025-04-01T12:00:00Z',
      },
      {
        slug: 'semana-consecutiva',
        nome: 'Semana Consecutiva',
        descricao: 'Contribuiu por 7 dias seguidos.',
        rarity: 'rare',
        category: 'global',
        isReserved: false,
        criteriaText: 'Contribua 7 dias consecutivos.',
        progressPercent: 100,
        unlockedAt: '2025-05-10T09:00:00Z',
      },
      {
        slug: 'apoiador',
        nome: 'Apoiador',
        descricao: 'Contribuiu financeiramente com o projeto.',
        rarity: 'epic',
        category: 'supporter',
        isReserved: false,
        criteriaText: 'Realize uma doação.',
        progressPercent: 100,
        unlockedAt: '2025-06-01T14:00:00Z',
      },
    ],
    achievementsLocked: [
      {
        slug: 'maratonista',
        nome: 'Maratonista',
        descricao: 'Contribuiu por 30 dias consecutivos.',
        rarity: 'legendary',
        category: 'global',
        isReserved: false,
        criteriaText: 'Contribua 30 dias consecutivos.',
        progressPercent: 40,
        unlockedAt: null,
      },
      {
        slug: 'especialista-linha-1',
        nome: 'Especialista Linha 1',
        descricao: 'Reportou 50 viagens na Linha 1.',
        rarity: 'rare',
        category: 'line',
        isReserved: false,
        criteriaText: 'Reporte 50 viagens na Linha 1.',
        progressPercent: 62,
        unlockedAt: null,
      },
    ],
    contributionHistory30d: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 8),
      points: Math.floor(Math.random() * 120),
    })),
    recentPointEvents: [
      {
        reason: 'relato_aprovado',
        points: 30,
        earnedAt: '2026-06-19T07:45:00Z',
        message: '+30 pts por relato aprovado na Linha 3.',
      },
      {
        reason: 'streak_bonus',
        points: 15,
        earnedAt: '2026-06-18T20:00:00Z',
        message: '+15 pts bônus de streak (12 dias).',
      },
      {
        reason: 'avaliacao_pos_viagem',
        points: 10,
        earnedAt: '2026-06-17T18:30:00Z',
        message: '+10 pts por avaliação pós-viagem.',
      },
    ],
  },
  monetization: {
    isPremium: true,
    supporterBadgeUnlocked: true,
    activeSubscription: {
      status: 'active',
      frequency: 'MONTHLY',
      amountCents: 990,
      startedAt: '2025-12-01T00:00:00Z',
      nextPaymentAt: '2026-07-01T00:00:00Z',
      cancelledAt: null,
    },
    lastDonationAt: '2025-11-15T00:00:00Z',
    nextPaymentAt: '2026-07-01T00:00:00Z',
    recentTransactions: [
      {
        kind: 'subscription',
        status: 'active',
        amountCents: 990,
        createdAt: '2025-12-01T00:00:00Z',
        paidAt: '2025-12-01T00:00:00Z',
        receiptUrl: 'https://example.com/recibo/001',
      },
      {
        kind: 'donation',
        status: 'paid',
        amountCents: 2000,
        createdAt: '2025-11-15T10:00:00Z',
        paidAt: '2025-11-15T10:05:00Z',
        receiptUrl: null,
      },
    ],
  },
};

const MOCK_PROFILE_NO_AVATAR: UserProfile = {
  ...MOCK_PROFILE,
  avatarUrl: null,
  nickname: null,
  gamification: {
    ...MOCK_PROFILE.gamification,
    weeklyRank: null,
    recentPointEvents: [],
    achievementsUnlocked: [],
  },
  monetization: {
    isPremium: false,
    supporterBadgeUnlocked: false,
    activeSubscription: null,
    lastDonationAt: null,
    nextPaymentAt: null,
    recentTransactions: [],
  },
};

const MOCK_PROFILE_WITH_AVATAR: UserProfile = {
  ...MOCK_PROFILE,
  avatarUrl: 'https://i.pravatar.cc/150?img=47',
};

const MOCK_PUBLIC_RANKING: PublicRankingResponse = {
  period: 'semanal',
  scope: 'geral',
  top: [
    { displayName: 'Rodrigo Almeida', score: 4_120 },
    { displayName: 'Camila Torres', score: 3_890 },
    { displayName: 'Felipe Nascimento', score: 3_560 },
    { displayName: 'Larissa Mendes', score: 3_200 },
    { displayName: 'Bruno Carvalho', score: 2_980 },
    { displayName: 'Juliana Ferreira', score: 2_750 },
    { displayName: 'Thiago Souza', score: 2_430 },
    { displayName: 'Priscila Lima', score: 2_100 },
    { displayName: 'Eduardo Costa', score: 1_870 },
    { displayName: 'Mariana Barbosa', score: 1_640 },
  ],
};

const MOCK_AUTH_RANKING: AuthenticatedRankingResponse = {
  period: 'semanal',
  scope: 'geral',
  entries: MOCK_PUBLIC_RANKING.top,
  currentUser: {
    displayName: 'Ana Beatriz Oliveira',
    score: 3_720,
    rank: 5,
  },
};

// ---------------------------------------------------------------------------
// Fetch interceptors for RankingPage
// ---------------------------------------------------------------------------

function interceptFetchWithRanking(
  publicData: PublicRankingResponse | null,
  authData: AuthenticatedRankingResponse | null,
  shouldFail = false,
) {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes('/v1/gamification/rankings/public')) {
      if (shouldFail) {
        throw new Error('Falha ao carregar ranking público: HTTP 500');
      }
      if (!publicData) {
        throw new Error('Falha ao carregar ranking público: HTTP 503');
      }
      return new Response(JSON.stringify(publicData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.includes('/v1/gamification/rankings/me')) {
      if (!authData) {
        return new Response('{}', { status: 401 });
      }
      return new Response(JSON.stringify(authData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Warmup and other endpoints
    if (url.includes('/warmup') || url.includes('/health')) {
      return new Response('ok', { status: 200 });
    }

    return originalFetch(input, init);
  };

  return () => {
    window.fetch = originalFetch;
  };
}

// ---------------------------------------------------------------------------
// Story setup hooks
// ---------------------------------------------------------------------------

function useSetupAnonymous() {
  useEffect(() => {
    useAuthStore.getState().setAnonymousSession();
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, []);
}

function useSetupAuthenticated() {
  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token-story',
      user: {
        id: 42,
        displayName: 'Ana Beatriz Oliveira',
        avatarUrl: null,
        nickname: 'anabeatriz',
      },
    });
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, []);
}

// ===========================================================================
// LOGIN PAGE STORIES
// ===========================================================================

/** LoginPage in its default idle state — ready for the user to click "Entrar". */
export const LoginIdle: Story = () => {
  useSetupAnonymous();
  return (
    <PageWrapper initialPath="/login">
      <LoginPage />
    </PageWrapper>
  );
};

/** LoginPage while auth bootstrap is still running — shows a spinner. */
export const LoginBooting: Story = () => {
  useEffect(() => {
    // Keep the store in booting state throughout this story
    useAuthStore.setState({
      authStatus: 'booting',
      isAuthenticated: false,
      user: null,
      accessToken: null,
    });
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, []);

  return (
    <PageWrapper initialPath="/login">
      <LoginPage />
    </PageWrapper>
  );
};

/** LoginPage after a failed OAuth callback — ?error=auth_failed in URL. */
export const LoginWithAuthError: Story = () => {
  useSetupAnonymous();
  return (
    <PageWrapper initialPath="/login?error=auth_failed">
      <LoginPage />
    </PageWrapper>
  );
};

/** LoginPage after a missing params OAuth callback — ?error=missing_params. */
export const LoginWithMissingParamsError: Story = () => {
  useSetupAnonymous();
  return (
    <PageWrapper initialPath="/login?error=missing_params">
      <LoginPage />
    </PageWrapper>
  );
};

/** LoginPage with an unrecognised error code from the backend. */
export const LoginWithUnknownError: Story = () => {
  useSetupAnonymous();
  return (
    <PageWrapper initialPath="/login?error=unexpected_code_xyz">
      <LoginPage />
    </PageWrapper>
  );
};

// ===========================================================================
// ABOUT PAGE STORIES
// ===========================================================================

/** AboutPage default view — all cards visible with tenant info. */
export const AboutDefault: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);
  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/sobre">
        <AboutPage />
      </PageWrapper>
    </QueryClientProvider>
  );
};

// ===========================================================================
// RANKING PAGE STORIES
// ===========================================================================

function RankingStoryBase({
  publicData,
  authData,
  isAuthenticated,
  shouldFail,
  initialPath = '/ranking',
}: {
  publicData: PublicRankingResponse | null;
  authData: AuthenticatedRankingResponse | null;
  isAuthenticated: boolean;
  shouldFail?: boolean;
  initialPath?: string;
}) {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    if (isAuthenticated) {
      useAuthStore.getState().setAuthenticatedSession({
        accessToken: 'mock-token',
        user: {
          id: 42,
          displayName: 'Ana Beatriz Oliveira',
          avatarUrl: null,
          nickname: 'anabeatriz',
        },
      });
    } else {
      useAuthStore.getState().setAnonymousSession();
    }
    const restore = interceptFetchWithRanking(publicData, authData, shouldFail);
    return () => {
      restore();
      useAuthStore.getState().setAnonymousSession();
    };
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath={initialPath}>
        <RankingPage />
      </PageWrapper>
    </QueryClientProvider>
  );
}

/** RankingPage — anonymous user, top 10 fully loaded. */
export const RankingAnonymousLoaded: Story = () => (
  <RankingStoryBase publicData={MOCK_PUBLIC_RANKING} authData={null} isAuthenticated={false} />
);

/** RankingPage — anonymous user while the request is in-flight (simulated by never resolving). */
export const RankingAnonymousLoading: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);
  useEffect(() => {
    useAuthStore.getState().setAnonymousSession();
    const original = window.fetch;
    // Never resolves — page stays in "Carregando..." state
    window.fetch = () => new Promise(() => {});
    return () => {
      window.fetch = original;
      useAuthStore.getState().setAnonymousSession();
    };
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/ranking">
        <RankingPage />
      </PageWrapper>
    </QueryClientProvider>
  );
};

/** RankingPage — anonymous user, ranking returned empty list. */
export const RankingAnonymousEmpty: Story = () => (
  <RankingStoryBase
    publicData={{ period: 'semanal', scope: 'geral', top: [] }}
    authData={null}
    isAuthenticated={false}
  />
);

/** RankingPage — anonymous user, public ranking fetch fails. */
export const RankingAnonymousError: Story = () => (
  <RankingStoryBase publicData={null} authData={null} isAuthenticated={false} shouldFail />
);

/** RankingPage — authenticated user with full ranking and own position highlighted. */
export const RankingAuthenticatedWithUserPosition: Story = () => (
  <RankingStoryBase
    publicData={MOCK_PUBLIC_RANKING}
    authData={MOCK_AUTH_RANKING}
    isAuthenticated={true}
  />
);

/** RankingPage — authenticated user, server did not return currentUser position. */
export const RankingAuthenticatedNoUserPosition: Story = () => (
  <RankingStoryBase
    publicData={MOCK_PUBLIC_RANKING}
    authData={{ ...MOCK_AUTH_RANKING, currentUser: null }}
    isAuthenticated={true}
  />
);

/** RankingPage — authenticated, period filter set to mensal. */
export const RankingPeriodMonthly: Story = () => (
  <RankingStoryBase
    publicData={{ ...MOCK_PUBLIC_RANKING, period: 'mensal' }}
    authData={{ ...MOCK_AUTH_RANKING, period: 'mensal' }}
    isAuthenticated={true}
  />
);

/** RankingPage — authenticated, period filter set to all_time. */
export const RankingPeriodAllTime: Story = () => (
  <RankingStoryBase
    publicData={{ ...MOCK_PUBLIC_RANKING, period: 'all_time' }}
    authData={{ ...MOCK_AUTH_RANKING, period: 'all_time' }}
    isAuthenticated={true}
  />
);

// ===========================================================================
// PROFILE PAGE STORIES
// ===========================================================================

/**
 * ProfileStoryBase — sets up query cache and auth state, then renders ProfilePage.
 *
 * profileData: pass a UserProfile to pre-seed the cache (bypasses the real query).
 *              pass null to simulate a cache miss (triggers loading).
 *              pass 'error' to simulate a failed query.
 */
function ProfileStoryBase({
  profileData,
  authStatus,
  isAuthenticated,
}: {
  profileData: UserProfile | null | 'error';
  authStatus: 'booting' | 'authenticated' | 'anonymous';
  isAuthenticated: boolean;
}) {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    if (authStatus === 'booting') {
      useAuthStore.setState({
        authStatus: 'booting',
        isAuthenticated: false,
        user: null,
        accessToken: null,
      });
    } else if (isAuthenticated) {
      useAuthStore.getState().setAuthenticatedSession({
        accessToken: 'mock-profile-token',
        user: {
          id: 42,
          displayName: 'Ana Beatriz Oliveira',
          avatarUrl: null,
          nickname: 'anabeatriz',
        },
      });
    } else {
      useAuthStore.getState().setAnonymousSession();
    }

    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, []);

  // Pre-seed the query cache when we have data
  useEffect(() => {
    if (profileData && profileData !== 'error') {
      qc.setQueryData<UserProfile>(PROFILE_QUERY_KEY, profileData);
    } else if (profileData === 'error') {
      qc.setQueryData<UserProfile>(PROFILE_QUERY_KEY, undefined);
      // Inject an error into the cache
      qc.getQueryCache().find({ queryKey: PROFILE_QUERY_KEY })?.destroy();
    }
  }, [qc, profileData]);

  // For error simulation, override the query fn with a rejected promise
  const errorQc = React.useMemo(() => {
    if (profileData !== 'error') return null;
    const errorClient = makeQueryClient();
    // Mark the query as failed immediately
    errorClient.getQueryCache().build(errorClient, {
      queryKey: PROFILE_QUERY_KEY,
      queryFn: () => Promise.reject(new Error('Falha ao carregar perfil: HTTP 500')),
      retry: false,
    });
    return errorClient;
  }, [profileData]);

  const client = errorQc ?? qc;

  return (
    <QueryClientProvider client={client}>
      <PageWrapper initialPath="/perfil">
        <ProfilePage />
      </PageWrapper>
    </QueryClientProvider>
  );
}

// We need a more direct approach for the error state using a wrapper component
// that seeds the query error state via hooks inside the QueryClientProvider.
function ProfileErrorSeeder({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  useEffect(() => {
    void qc
      .prefetchQuery({
        queryKey: PROFILE_QUERY_KEY,
        queryFn: () => Promise.reject(new Error('Falha ao carregar perfil: HTTP 500')),
        retry: false,
      } as any)
      .catch(() => {});
  }, [qc]);
  return <>{children}</>;
}

/** ProfilePage — loading state (auth ok, query pending). */
export const ProfileLoading: Story = () => {
  const qc = React.useMemo(() => {
    const client = makeQueryClient();
    // Stall the query so the loading screen stays
    return client;
  }, []);

  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token',
      user: {
        id: 42,
        displayName: 'Ana Beatriz Oliveira',
        avatarUrl: null,
        nickname: 'anabeatriz',
      },
    });

    const original = window.fetch;
    window.fetch = () => new Promise(() => {}); // never resolves
    return () => {
      window.fetch = original;
      useAuthStore.getState().setAnonymousSession();
    };
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <ProfilePage />
      </PageWrapper>
    </QueryClientProvider>
  );
};

/** ProfilePage — auth ok but the profile fetch returned an error. */
export const ProfileError: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token',
      user: {
        id: 42,
        displayName: 'Ana Beatriz Oliveira',
        avatarUrl: null,
        nickname: 'anabeatriz',
      },
    });

    const original = window.fetch;
    window.fetch = () => Promise.resolve(new Response('Forbidden', { status: 500 }));
    return () => {
      window.fetch = original;
      useAuthStore.getState().setAnonymousSession();
    };
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <ProfileErrorSeeder>
          <ProfilePage />
        </ProfileErrorSeeder>
      </PageWrapper>
    </QueryClientProvider>
  );
};

/** ProfilePage — unauthenticated user is redirected (Navigate to /). */
export const ProfileUnauthenticated: Story = () => {
  useEffect(() => {
    useAuthStore.getState().setAnonymousSession();
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, []);

  const qc = React.useMemo(makeQueryClient, []);
  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <ProfilePage />
      </PageWrapper>
    </QueryClientProvider>
  );
};

/** ProfilePage — authStatus is 'booting', shows validating session screen. */
export const ProfileBooting: Story = () => {
  useEffect(() => {
    useAuthStore.setState({
      authStatus: 'booting',
      isAuthenticated: false,
      user: null,
      accessToken: null,
    });
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, []);

  const qc = React.useMemo(makeQueryClient, []);
  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <ProfilePage />
      </PageWrapper>
    </QueryClientProvider>
  );
};

/** Fully loaded ProfilePage — default avatar, Atividade tab. */
export const ProfileDefaultAvatarTab: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token',
      user: {
        id: 42,
        displayName: 'Ana Beatriz Oliveira',
        avatarUrl: null,
        nickname: 'anabeatriz',
      },
    });
    qc.setQueryData<UserProfile>(PROFILE_QUERY_KEY, MOCK_PROFILE_NO_AVATAR);
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, [qc]);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <ProfilePage />
      </PageWrapper>
    </QueryClientProvider>
  );
};

/** Fully loaded ProfilePage — profile with a real avatar URL. */
export const ProfileWithAvatarTab: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token',
      user: {
        id: 42,
        displayName: 'Ana Beatriz Oliveira',
        avatarUrl: 'https://i.pravatar.cc/150?img=47',
        nickname: 'anabeatriz',
      },
    });
    qc.setQueryData<UserProfile>(PROFILE_QUERY_KEY, MOCK_PROFILE_WITH_AVATAR);
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, [qc]);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <ProfilePage />
      </PageWrapper>
    </QueryClientProvider>
  );
};

/** ProfilePage — no nickname, no recent events, no weekly rank (minimal state). */
export const ProfileNoNicknameNoEvents: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token',
      user: { id: 99, displayName: 'Carlos Silva', avatarUrl: null, nickname: null },
    });
    qc.setQueryData<UserProfile>(PROFILE_QUERY_KEY, {
      ...MOCK_PROFILE_NO_AVATAR,
      displayName: 'Carlos Silva',
      nickname: null,
      gamification: {
        ...MOCK_PROFILE_NO_AVATAR.gamification,
        weeklyRank: null,
        recentPointEvents: [],
        achievementsUnlocked: [],
        achievementsLocked: MOCK_PROFILE.gamification.achievementsLocked,
      },
    });
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, [qc]);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <ProfilePage />
      </PageWrapper>
    </QueryClientProvider>
  );
};

/**
 * ProfilePage — Atividade tab with rich gamification data:
 * achievements, heatmap and recent point events all populated.
 */
export const ProfileActivityTab: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token',
      user: {
        id: 42,
        displayName: 'Ana Beatriz Oliveira',
        avatarUrl: null,
        nickname: 'anabeatriz',
      },
    });
    qc.setQueryData<UserProfile>(PROFILE_QUERY_KEY, MOCK_PROFILE);
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, [qc]);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <ProfilePage />
      </PageWrapper>
    </QueryClientProvider>
  );
};

/**
 * ProfilePage — Configurações tab visible.
 * Uses a small trick: render the page and immediately click the tab via a ref.
 */
function SettingsTabActivator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const tab =
        document.querySelector<HTMLButtonElement>('[data-value="configuracoes"]') ??
        Array.from(document.querySelectorAll<HTMLButtonElement>('button[role="tab"]')).find((b) =>
          b.textContent?.includes('Configurações'),
        );
      tab?.click();
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);
  return <>{children}</>;
}

export const ProfileSettingsTab: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token',
      user: {
        id: 42,
        displayName: 'Ana Beatriz Oliveira',
        avatarUrl: null,
        nickname: 'anabeatriz',
      },
    });
    qc.setQueryData<UserProfile>(PROFILE_QUERY_KEY, MOCK_PROFILE);
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, [qc]);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <SettingsTabActivator>
          <ProfilePage />
        </SettingsTabActivator>
      </PageWrapper>
    </QueryClientProvider>
  );
};

/** ProfilePage — Apoio tab, Premium user with active subscription and transactions. */
function SupportTabActivator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const tab = Array.from(
        document.querySelectorAll<HTMLButtonElement>('button[role="tab"]'),
      ).find((b) => b.textContent?.includes('Apoio'));
      tab?.click();
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);
  return <>{children}</>;
}

export const ProfileSupportTab: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token',
      user: {
        id: 42,
        displayName: 'Ana Beatriz Oliveira',
        avatarUrl: null,
        nickname: 'anabeatriz',
      },
    });
    qc.setQueryData<UserProfile>(PROFILE_QUERY_KEY, MOCK_PROFILE);
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, [qc]);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <SupportTabActivator>
          <ProfilePage />
        </SupportTabActivator>
      </PageWrapper>
    </QueryClientProvider>
  );
};

/** ProfilePage — Apoio tab, non-premium user with no transactions. */
export const ProfileSupportTabNoPremium: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token',
      user: { id: 99, displayName: 'Carlos Silva', avatarUrl: null, nickname: null },
    });
    qc.setQueryData<UserProfile>(PROFILE_QUERY_KEY, MOCK_PROFILE_NO_AVATAR);
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, [qc]);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <SupportTabActivator>
          <ProfilePage />
        </SupportTabActivator>
      </PageWrapper>
    </QueryClientProvider>
  );
};

/** ProfilePage — Conta tab with logout and delete account buttons. */
function AccountTabActivator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const tab = Array.from(
        document.querySelectorAll<HTMLButtonElement>('button[role="tab"]'),
      ).find((b) => b.textContent?.includes('Conta'));
      tab?.click();
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);
  return <>{children}</>;
}

export const ProfileAccountTab: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token',
      user: {
        id: 42,
        displayName: 'Ana Beatriz Oliveira',
        avatarUrl: null,
        nickname: 'anabeatriz',
      },
    });
    qc.setQueryData<UserProfile>(PROFILE_QUERY_KEY, MOCK_PROFILE);
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, [qc]);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <AccountTabActivator>
          <ProfilePage />
        </AccountTabActivator>
      </PageWrapper>
    </QueryClientProvider>
  );
};

/**
 * ProfilePage — shows the success FeedbackBanner after a profile update.
 * Simulates it by injecting the banner state through a controlled wrapper.
 */
function SuccessFeedbackInjector({ children }: { children: React.ReactNode }) {
  // Simulate clicking the "Perfil público" toggle and getting a success response
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;
      if (url.includes('/v1/auth/profile') && init?.method === 'PATCH') {
        return new Response(JSON.stringify({ ...MOCK_PROFILE, profilePublic: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return original(input, init);
    };

    // Auto-click toggle after mount to trigger success feedback
    const timer = window.setTimeout(() => {
      const switchRows = document.querySelectorAll<HTMLButtonElement>('button[role="switch"]');
      switchRows[0]?.click();
    }, 200);

    return () => {
      window.clearTimeout(timer);
      window.fetch = original;
    };
  }, []);
  return <>{children}</>;
}

export const ProfileWithSuccessFeedback: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token',
      user: {
        id: 42,
        displayName: 'Ana Beatriz Oliveira',
        avatarUrl: null,
        nickname: 'anabeatriz',
      },
    });
    qc.setQueryData<UserProfile>(PROFILE_QUERY_KEY, MOCK_PROFILE);
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, [qc]);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <SettingsTabActivator>
          <SuccessFeedbackInjector>
            <ProfilePage />
          </SuccessFeedbackInjector>
        </SettingsTabActivator>
      </PageWrapper>
    </QueryClientProvider>
  );
};

/** ProfilePage — shows the error FeedbackBanner after a failed profile update. */
function ErrorFeedbackInjector({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;
      if (url.includes('/v1/auth/profile') && init?.method === 'PATCH') {
        return new Response('Internal Server Error', { status: 500 });
      }
      return original(input, init);
    };

    const timer = window.setTimeout(() => {
      const switchRows = document.querySelectorAll<HTMLButtonElement>('button[role="switch"]');
      switchRows[0]?.click();
    }, 200);

    return () => {
      window.clearTimeout(timer);
      window.fetch = original;
    };
  }, []);
  return <>{children}</>;
}

export const ProfileWithErrorFeedback: Story = () => {
  const qc = React.useMemo(makeQueryClient, []);

  useEffect(() => {
    useAuthStore.getState().setAuthenticatedSession({
      accessToken: 'mock-token',
      user: {
        id: 42,
        displayName: 'Ana Beatriz Oliveira',
        avatarUrl: null,
        nickname: 'anabeatriz',
      },
    });
    qc.setQueryData<UserProfile>(PROFILE_QUERY_KEY, MOCK_PROFILE);
    return () => {
      useAuthStore.getState().setAnonymousSession();
    };
  }, [qc]);

  return (
    <QueryClientProvider client={qc}>
      <PageWrapper initialPath="/perfil">
        <SettingsTabActivator>
          <ErrorFeedbackInjector>
            <ProfilePage />
          </ErrorFeedbackInjector>
        </SettingsTabActivator>
      </PageWrapper>
    </QueryClientProvider>
  );
};
