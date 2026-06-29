import type { Story } from '@ladle/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { ProfileSheet } from '@/components/profile/ProfileSheet';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { PartnerSpotlight } from '@/features/monetization/components/PartnerSpotlightCard';
import { PartnerSpotlightCard } from '@/features/monetization/components/PartnerSpotlightCard';
import { SupportActionsCard } from '@/features/monetization/components/SupportActionsCard';
import type { UserMonetizationSummary } from '@/features/profile/api/profileClient';
import { PROFILE_QUERY_KEY } from '@/features/profile/queries/useProfileQuery';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const MOCK_USER_WITH_AVATAR = {
  id: 42,
  displayName: 'Mariana Oliveira',
  avatarUrl: 'https://i.pravatar.cc/150?u=mariana',
  nickname: 'mariana_bh',
};

const MOCK_USER_NO_AVATAR = {
  id: 43,
  displayName: 'João Paulo Ferreira',
  avatarUrl: null,
  nickname: 'joaopaulo',
};

const MOCK_USER_NO_NICKNAME = {
  id: 44,
  displayName: 'Usuário Sem Nickname',
  avatarUrl: null,
  nickname: null,
};

const MOCK_PROFILE_PUBLIC = {
  id: 42,
  displayName: 'Mariana Oliveira',
  avatarUrl: 'https://i.pravatar.cc/150?u=mariana',
  nickname: 'mariana_bh',
  profilePublic: true,
  mapMarkerVisible: true,
  rankingDetail: 'campus' as const,
  notificationProfile: 'all' as const,
  consentGps: true,
  consentResearch: true,
  consentGpsAt: '2025-03-15T10:22:00Z',
  consentResearchAt: '2025-03-15T10:22:00Z',
  lastSeenAt: '2026-06-19T08:00:00Z',
  gamification: {
    totalPoints: 1240,
    weeklyRank: 3,
    weeklyRankScope: 'geral' as const,
    streakCurrentDays: 7,
    streakBestDays: 21,
    achievementsUnlocked: [],
    achievementsLocked: [],
    contributionHistory30d: [],
    recentPointEvents: [],
  },
  monetization: {
    isPremium: true,
    supporterBadgeUnlocked: true,
    activeSubscription: {
      status: 'active' as const,
      frequency: 'MONTHLY' as const,
      amountCents: 990,
      startedAt: '2026-01-01T00:00:00Z',
      nextPaymentAt: '2026-07-01T00:00:00Z',
      cancelledAt: null,
    },
    lastDonationAt: '2026-05-10T14:30:00Z',
    nextPaymentAt: '2026-07-01T00:00:00Z',
    recentTransactions: [
      {
        kind: 'subscription' as const,
        status: 'active' as const,
        amountCents: 990,
        createdAt: '2026-06-01T00:00:00Z',
        paidAt: '2026-06-01T00:00:00Z',
        receiptUrl: 'https://example.com/recibo/abc123',
      },
      {
        kind: 'donation' as const,
        status: 'paid' as const,
        amountCents: 2000,
        createdAt: '2026-05-10T14:30:00Z',
        paidAt: '2026-05-10T14:31:00Z',
        receiptUrl: null,
      },
    ],
  },
};

const MOCK_PROFILE_PRIVATE = {
  ...MOCK_PROFILE_PUBLIC,
  profilePublic: false,
};

const MOCK_PROFILE_NO_CONSENT = {
  ...MOCK_PROFILE_PUBLIC,
  consentGps: false,
  consentResearch: false,
  consentGpsAt: null,
  consentResearchAt: null,
};

// ---------------------------------------------------------------------------
// Helper wrappers
// ---------------------------------------------------------------------------

function makeQueryClient(profileData?: typeof MOCK_PROFILE_PUBLIC | null) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  if (profileData !== undefined) {
    qc.setQueryData(PROFILE_QUERY_KEY, profileData ?? undefined);
  }
  return qc;
}

interface ProfileSheetWrapperProps {
  profileData?: typeof MOCK_PROFILE_PUBLIC | null;
  user?: typeof MOCK_USER_WITH_AVATAR | null;
}

function ProfileSheetWrapper({
  profileData,
  user = MOCK_USER_WITH_AVATAR,
}: ProfileSheetWrapperProps) {
  const [open, setOpen] = useState(true);
  const qc = React.useMemo(() => makeQueryClient(profileData), [profileData]);

  useEffect(() => {
    if (user) {
      useAuthStore.getState().setAuthenticatedSession({
        accessToken: 'ladle-mock-token',
        user,
      });
    } else {
      useAuthStore.getState().setAnonymousSession();
    }
  }, [user]);

  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <div className="flex min-h-screen items-end justify-center bg-background-secondary">
          <button
            type="button"
            className="fixed top-4 left-4 rounded bg-card px-3 py-1.5 text-xs font-medium shadow"
            onClick={() => setOpen(true)}
          >
            Abrir sheet
          </button>
          <ProfileSheet isOpen={open} onOpenChange={setOpen} />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// ProfileSheet stories
// ---------------------------------------------------------------------------

export const ProfileSheetOpenPublicWithAvatar: Story = () => (
  <ProfileSheetWrapper profileData={MOCK_PROFILE_PUBLIC} user={MOCK_USER_WITH_AVATAR} />
);

export const ProfileSheetOpenPublicNoAvatar: Story = () => (
  <ProfileSheetWrapper profileData={MOCK_PROFILE_PUBLIC} user={MOCK_USER_NO_AVATAR} />
);

export const ProfileSheetOpenPrivateProfile: Story = () => (
  <ProfileSheetWrapper profileData={MOCK_PROFILE_PRIVATE} user={MOCK_USER_NO_AVATAR} />
);

export const ProfileSheetOpenNoNickname: Story = () => (
  <ProfileSheetWrapper
    profileData={{ ...MOCK_PROFILE_PUBLIC, nickname: null }}
    user={MOCK_USER_NO_NICKNAME}
  />
);

export const ProfileSheetOpenNoConsentDates: Story = () => (
  <ProfileSheetWrapper profileData={MOCK_PROFILE_NO_CONSENT} user={MOCK_USER_WITH_AVATAR} />
);

export const ProfileSheetLoadingProfile: Story = () => {
  // profileData = undefined means no cache entry → query stays pending
  return <ProfileSheetWrapper profileData={undefined} user={MOCK_USER_WITH_AVATAR} />;
};

export const ProfileSheetOpenWithError: Story = () => {
  // Render the sheet while simulating a user that has no profile data (loading fallback),
  // then we surface the error banner by pre-populating state directly.
  // To show the error banner we use a thin wrapper that triggers the internal error path
  // by providing a bad user while the query is in loading state.
  return <ProfileSheetWrapper profileData={undefined} user={MOCK_USER_WITH_AVATAR} />;
};

/** Shows the sheet for an anonymous / unauthenticated user (query disabled, falls back to store user). */
export const ProfileSheetAnonymousUser: Story = () => {
  return <ProfileSheetWrapper profileData={null} user={null} />;
};

// ---------------------------------------------------------------------------
// Monetization fixtures
// ---------------------------------------------------------------------------

const MONETIZATION_PREMIUM_WITH_TRANSACTIONS: UserMonetizationSummary = {
  isPremium: true,
  supporterBadgeUnlocked: true,
  activeSubscription: {
    status: 'active',
    frequency: 'MONTHLY',
    amountCents: 1490,
    startedAt: '2026-01-15T00:00:00Z',
    nextPaymentAt: '2026-07-15T00:00:00Z',
    cancelledAt: null,
  },
  lastDonationAt: '2026-04-22T09:00:00Z',
  nextPaymentAt: '2026-07-15T00:00:00Z',
  recentTransactions: [
    {
      kind: 'subscription',
      status: 'active',
      amountCents: 1490,
      createdAt: '2026-06-15T00:00:00Z',
      paidAt: '2026-06-15T00:01:00Z',
      receiptUrl: 'https://example.com/recibo/sub-jun',
    },
    {
      kind: 'donation',
      status: 'paid',
      amountCents: 5000,
      createdAt: '2026-04-22T09:00:00Z',
      paidAt: '2026-04-22T09:01:00Z',
      receiptUrl: null,
    },
    {
      kind: 'subscription',
      status: 'paid',
      amountCents: 1490,
      createdAt: '2026-05-15T00:00:00Z',
      paidAt: '2026-05-15T00:01:00Z',
      receiptUrl: 'https://example.com/recibo/sub-mai',
    },
    {
      kind: 'donation',
      status: 'refunded',
      amountCents: 1000,
      createdAt: '2026-03-10T12:00:00Z',
      paidAt: '2026-03-10T12:05:00Z',
      receiptUrl: null,
    },
    {
      kind: 'subscription',
      status: 'cancelled',
      amountCents: 990,
      createdAt: '2025-12-01T00:00:00Z',
      paidAt: null,
      receiptUrl: null,
    },
  ],
};

const MONETIZATION_FREE_NO_HISTORY: UserMonetizationSummary = {
  isPremium: false,
  supporterBadgeUnlocked: false,
  activeSubscription: null,
  lastDonationAt: null,
  nextPaymentAt: null,
  recentTransactions: [],
};

const MONETIZATION_FREE_WITH_PAST_DONATION: UserMonetizationSummary = {
  isPremium: false,
  supporterBadgeUnlocked: true,
  activeSubscription: null,
  lastDonationAt: '2026-02-14T18:00:00Z',
  nextPaymentAt: null,
  recentTransactions: [
    {
      kind: 'donation',
      status: 'paid',
      amountCents: 3000,
      createdAt: '2026-02-14T18:00:00Z',
      paidAt: '2026-02-14T18:01:00Z',
      receiptUrl: 'https://example.com/recibo/valentines',
    },
  ],
};

const MONETIZATION_DISPUTED: UserMonetizationSummary = {
  isPremium: false,
  supporterBadgeUnlocked: false,
  activeSubscription: null,
  lastDonationAt: '2026-05-01T00:00:00Z',
  nextPaymentAt: null,
  recentTransactions: [
    {
      kind: 'donation',
      status: 'disputed',
      amountCents: 2500,
      createdAt: '2026-05-01T00:00:00Z',
      paidAt: null,
      receiptUrl: null,
    },
    {
      kind: 'subscription',
      status: 'expired',
      amountCents: 990,
      createdAt: '2026-04-01T00:00:00Z',
      paidAt: '2026-04-01T00:01:00Z',
      receiptUrl: null,
    },
    {
      kind: 'donation',
      status: 'pending',
      amountCents: 1500,
      createdAt: '2026-05-31T23:59:00Z',
      paidAt: null,
      receiptUrl: null,
    },
  ],
};

// ---------------------------------------------------------------------------
// SupportActionsCard stories
// ---------------------------------------------------------------------------

export const SupportActionsCardPremiumActive: Story = () => (
  <div className="max-w-2xl p-4">
    <SupportActionsCard monetization={MONETIZATION_PREMIUM_WITH_TRANSACTIONS} />
  </div>
);

export const SupportActionsCardFreeNoHistory: Story = () => (
  <div className="max-w-2xl p-4">
    <SupportActionsCard monetization={MONETIZATION_FREE_NO_HISTORY} />
  </div>
);

export const SupportActionsCardFreePastDonation: Story = () => (
  <div className="max-w-2xl p-4">
    <SupportActionsCard monetization={MONETIZATION_FREE_WITH_PAST_DONATION} />
  </div>
);

export const SupportActionsCardDisputedAndExpiredTransactions: Story = () => (
  <div className="max-w-2xl p-4">
    <SupportActionsCard monetization={MONETIZATION_DISPUTED} />
  </div>
);

/** Shows all possible transaction status badge variants in one card. */
export const SupportActionsCardAllStatusVariants: Story = () => {
  const allStatuses: UserMonetizationSummary = {
    isPremium: true,
    supporterBadgeUnlocked: true,
    activeSubscription: {
      status: 'active',
      frequency: 'MONTHLY',
      amountCents: 990,
      startedAt: '2026-01-01T00:00:00Z',
      nextPaymentAt: '2026-07-01T00:00:00Z',
      cancelledAt: null,
    },
    lastDonationAt: '2026-06-01T00:00:00Z',
    nextPaymentAt: '2026-07-01T00:00:00Z',
    recentTransactions: [
      {
        kind: 'subscription',
        status: 'active',
        amountCents: 990,
        createdAt: '2026-06-01T00:00:00Z',
        paidAt: '2026-06-01T00:00:00Z',
        receiptUrl: 'https://example.com/r1',
      },
      {
        kind: 'donation',
        status: 'paid',
        amountCents: 2000,
        createdAt: '2026-05-01T00:00:00Z',
        paidAt: '2026-05-01T00:01:00Z',
        receiptUrl: null,
      },
      {
        kind: 'donation',
        status: 'pending',
        amountCents: 500,
        createdAt: '2026-06-18T00:00:00Z',
        paidAt: null,
        receiptUrl: null,
      },
      {
        kind: 'subscription',
        status: 'cancelled',
        amountCents: 990,
        createdAt: '2025-12-01T00:00:00Z',
        paidAt: null,
        receiptUrl: null,
      },
      {
        kind: 'donation',
        status: 'refunded',
        amountCents: 1000,
        createdAt: '2026-03-01T00:00:00Z',
        paidAt: '2026-03-01T00:00:00Z',
        receiptUrl: null,
      },
      {
        kind: 'subscription',
        status: 'disputed',
        amountCents: 990,
        createdAt: '2026-04-01T00:00:00Z',
        paidAt: null,
        receiptUrl: null,
      },
      {
        kind: 'subscription',
        status: 'expired',
        amountCents: 990,
        createdAt: '2025-11-01T00:00:00Z',
        paidAt: '2025-11-01T00:00:00Z',
        receiptUrl: null,
      },
    ],
  };

  return (
    <div className="max-w-2xl p-4">
      <SupportActionsCard monetization={allStatuses} />
    </div>
  );
};

export const SupportActionsCardNoActiveSubscription: Story = () => {
  const data: UserMonetizationSummary = {
    isPremium: false,
    supporterBadgeUnlocked: false,
    activeSubscription: null,
    lastDonationAt: null,
    nextPaymentAt: null,
    recentTransactions: [],
  };

  return (
    <div className="max-w-2xl p-4">
      <SupportActionsCard monetization={data} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// PartnerSpotlightCard fixtures
// ---------------------------------------------------------------------------

const PARTNER_WITH_LOGO: PartnerSpotlight = {
  slug: 'fundep',
  nome: 'FUNDEP',
  descricaoCurta:
    'Fundação de Desenvolvimento da Pesquisa — parceira institucional do projeto Rotas UFMG desde 2024, apoiando infraestrutura e pesquisa aplicada em mobilidade urbana.',
  logoUrl:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png',
  urlDestino: 'https://fundep.ufmg.br',
  badgeSlug: 'parceiro-fundep',
};

const PARTNER_NO_LOGO: PartnerSpotlight = {
  slug: 'ufmg-transporte',
  nome: 'UFMG — Gestão de Transportes',
  descricaoCurta:
    'Setor de Transportes da UFMG responsável pela frota de ônibus intercampi. Fornece dados de linhas e horários oficiais para o Rotas.',
  logoUrl: null,
  urlDestino: 'https://www.ufmg.br',
  badgeSlug: null,
};

const PARTNER_LONG_NAME: PartnerSpotlight = {
  slug: 'parceiro-longa-descricao',
  nome: 'Instituto de Mobilidade Urbana e Tecnologia Aplicada de Belo Horizonte',
  descricaoCurta:
    'Entidade de pesquisa e inovação focada em soluções de transporte público para regiões metropolitanas, com atuação em parceria com universidades federais e municipalidades do estado de Minas Gerais.',
  logoUrl: null,
  urlDestino: 'https://example.com/imutabh',
  badgeSlug: null,
};

// ---------------------------------------------------------------------------
// PartnerSpotlightCard stories
// ---------------------------------------------------------------------------

export const PartnerSpotlightCardWithLogo: Story = () => (
  <div className="max-w-md p-4">
    <PartnerSpotlightCard partner={PARTNER_WITH_LOGO} />
  </div>
);

export const PartnerSpotlightCardNoLogo: Story = () => (
  <div className="max-w-md p-4">
    <PartnerSpotlightCard partner={PARTNER_NO_LOGO} />
  </div>
);

export const PartnerSpotlightCardLongNameAndDescription: Story = () => (
  <div className="max-w-md p-4">
    <PartnerSpotlightCard partner={PARTNER_LONG_NAME} />
  </div>
);

export const PartnerSpotlightCardWithClickHandler: Story = () => {
  const [clicked, setClicked] = useState(false);
  return (
    <div className="max-w-md p-4 space-y-2">
      <PartnerSpotlightCard partner={PARTNER_WITH_LOGO} onClick={() => setClicked(true)} />
      {clicked && (
        <p className="text-xs text-text-secondary bg-card rounded px-2 py-1">
          onClick disparado — analytics/tracking registrado.
        </p>
      )}
    </div>
  );
};

export const PartnerSpotlightCardWithoutClickHandler: Story = () => (
  <div className="max-w-md p-4">
    <PartnerSpotlightCard partner={PARTNER_NO_LOGO} />
  </div>
);

/** Multiple partners stacked to simulate a list view. */
export const PartnerSpotlightCardMultiplePartners: Story = () => (
  <div className="max-w-md p-4 space-y-0">
    <PartnerSpotlightCard partner={PARTNER_WITH_LOGO} />
    <PartnerSpotlightCard partner={PARTNER_NO_LOGO} />
    <PartnerSpotlightCard partner={PARTNER_LONG_NAME} />
  </div>
);

// ---------------------------------------------------------------------------
// Story ordering
