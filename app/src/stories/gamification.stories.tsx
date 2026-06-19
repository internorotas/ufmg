import type { Story } from '@ladle/react';
import React from 'react';
import { AchievementsGrid } from '@/features/gamification/components/AchievementsGrid';
import { ContributionHeatmap } from '@/features/gamification/components/ContributionHeatmap';
import { PointDeltaToast } from '@/features/gamification/components/PointDeltaToast';
import type {
  AchievementView,
  ContributionHistoryPoint,
  RecentPointEvent,
} from '@/features/profile/api/profileClient';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const achievementComumUnlocked: AchievementView = {
  slug: 'primeira-rota',
  nome: 'Primeira Rota',
  descricao: 'Registre sua primeira rota no sistema.',
  rarity: 'common',
  criteriaText: 'Registre ao menos 1 rota.',
  progressPercent: null,
  isReserved: false,
};

const achievementRaroUnlocked: AchievementView = {
  slug: 'explorador',
  nome: 'Explorador',
  descricao: 'Registre rotas em 5 estados diferentes.',
  rarity: 'rare',
  criteriaText: 'Visite 5 estados distintos.',
  progressPercent: null,
  isReserved: false,
};

const achievementEpicoUnlocked: AchievementView = {
  slug: 'viajante-assiduo',
  nome: 'Viajante Assíduo',
  descricao: 'Complete 50 rotas no total.',
  rarity: 'epic',
  criteriaText: 'Conclua 50 rotas registradas.',
  progressPercent: null,
  isReserved: false,
};

const achievementLendarioUnlocked: AchievementView = {
  slug: 'mestre-das-estradas',
  nome: 'Mestre das Estradas',
  descricao: 'Complete 200 rotas no total.',
  rarity: 'legendary',
  criteriaText: 'Conclua 200 rotas registradas.',
  progressPercent: null,
  isReserved: false,
};

const achievementLockedComProgress: AchievementView = {
  slug: 'velocista',
  nome: 'Velocista',
  descricao: 'Registre 10 rotas em um único dia.',
  rarity: 'rare',
  criteriaText: 'Registre 10 rotas no mesmo dia.',
  progressPercent: 40,
  isReserved: false,
};

const achievementLockedNoProgress: AchievementView = {
  slug: 'sertanejo',
  nome: 'Sertanejo',
  descricao: 'Registre rotas nos 9 estados do Nordeste.',
  rarity: 'epic',
  criteriaText: 'Passe por todos os estados nordestinos.',
  progressPercent: null,
  isReserved: false,
};

const achievementReserved: AchievementView = {
  slug: 'pioneiro-digital',
  nome: 'Pioneiro Digital',
  descricao: 'Conquista exclusiva de fases futuras do sistema.',
  rarity: 'legendary',
  criteriaText: 'A ser revelado.',
  progressPercent: null,
  isReserved: true,
};

const achievementLockedFullProgress: AchievementView = {
  slug: 'maratonista',
  nome: 'Maratonista',
  descricao: 'Registre 100 rotas no total.',
  rarity: 'epic',
  criteriaText: 'Conclua 100 rotas registradas.',
  progressPercent: 87,
  isReserved: false,
};

const achievementLockedZeroProgress: AchievementView = {
  slug: 'norte-a-sul',
  nome: 'Norte ao Sul',
  descricao: 'Registre rotas cobrindo todas as regiões do Brasil.',
  rarity: 'legendary',
  criteriaText: 'Cubra as 5 regiões brasileiras.',
  progressPercent: 0,
  isReserved: false,
};

// Contribution history — 30 days
function makeDays(overrides: Partial<ContributionHistoryPoint>[] = []): ContributionHistoryPoint[] {
  const days: ContributionHistoryPoint[] = [];
  const base = new Date('2026-05-20');
  for (let i = 0; i < 30; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const date = d.toISOString().split('T')[0];
    days.push({ date, points: 0, count: 0, ...overrides[i] });
  }
  return days;
}

const emptyHistory = makeDays();

const sparseHistory = makeDays([
  { points: 5, count: 1 },
  {},
  {},
  { points: 12, count: 2 },
  {},
  {},
  {},
  { points: 3, count: 1 },
  {},
  {},
  {},
  {},
  { points: 25, count: 4 },
  {},
  {},
  { points: 7, count: 1 },
  {},
  {},
  {},
  {},
  { points: 60, count: 8 },
  {},
  {},
  {},
  { points: 1, count: 1 },
  {},
  {},
  {},
  { points: 18, count: 3 },
  {},
]);

const denseHistory = makeDays(
  Array.from({ length: 30 }, (_, i) => {
    const pts =
      [
        0, 5, 12, 25, 55, 3, 18, 0, 8, 60, 22, 4, 1, 50, 30, 7, 14, 0, 9, 45, 2, 33, 0, 17, 6, 28,
        51, 0, 10, 40,
      ][i] ?? 0;
    return { points: pts, count: Math.ceil(pts / 5) };
  }),
);

const allIntensityHistory = makeDays([
  { points: 0, count: 0 },
  { points: 1, count: 1 },
  { points: 5, count: 1 },
  { points: 10, count: 2 },
  { points: 15, count: 3 },
  { points: 20, count: 4 },
  { points: 30, count: 5 },
  { points: 50, count: 8 },
  { points: 75, count: 10 },
  { points: 100, count: 15 },
  ...Array(20).fill({ points: 0, count: 0 }),
]);

// Point events
const eventLowPoints: RecentPointEvent = {
  points: 5,
  message: 'Rota registrada com sucesso.',
};

const eventMediumPoints: RecentPointEvent = {
  points: 25,
  message: 'Conquista desbloqueada: Explorador!',
};

const eventHighPoints: RecentPointEvent = {
  points: 100,
  message: 'Sequência de 7 dias consecutivos!',
};

const eventLongMessage: RecentPointEvent = {
  points: 50,
  message:
    'Parabéns! Você registrou sua rota número 50 e desbloqueou a conquista Viajante Assíduo.',
};

// ---------------------------------------------------------------------------
// AchievementsGrid stories
// ---------------------------------------------------------------------------

export const AchievementsGridAllVariants: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid
      unlocked={[
        achievementComumUnlocked,
        achievementRaroUnlocked,
        achievementEpicoUnlocked,
        achievementLendarioUnlocked,
      ]}
      locked={[
        achievementLockedComProgress,
        achievementLockedNoProgress,
        achievementLockedFullProgress,
        achievementLockedZeroProgress,
        achievementReserved,
      ]}
    />
  </div>
);

export const AchievementsGridOnlyUnlocked: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid
      unlocked={[
        achievementComumUnlocked,
        achievementRaroUnlocked,
        achievementEpicoUnlocked,
        achievementLendarioUnlocked,
      ]}
      locked={[]}
    />
  </div>
);

export const AchievementsGridOnlyLocked: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid
      unlocked={[]}
      locked={[
        achievementLockedComProgress,
        achievementLockedNoProgress,
        achievementLockedFullProgress,
        achievementLockedZeroProgress,
        achievementReserved,
      ]}
    />
  </div>
);

export const AchievementsGridEmpty: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid unlocked={[]} locked={[]} />
  </div>
);

export const AchievementsGridSingleUnlocked: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid unlocked={[achievementComumUnlocked]} locked={[]} />
  </div>
);

export const AchievementsGridLockedWithProgress: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid
      unlocked={[]}
      locked={[
        achievementLockedComProgress,
        achievementLockedFullProgress,
        achievementLockedZeroProgress,
      ]}
    />
  </div>
);

export const AchievementsGridLockedNoProgress: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid unlocked={[]} locked={[achievementLockedNoProgress, achievementReserved]} />
  </div>
);

export const AchievementsGridReservedAchievement: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid unlocked={[]} locked={[achievementReserved]} />
  </div>
);

export const AchievementsGridRarityCommon: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid unlocked={[achievementComumUnlocked]} locked={[]} />
  </div>
);

export const AchievementsGridRarityRare: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid unlocked={[achievementRaroUnlocked]} locked={[]} />
  </div>
);

export const AchievementsGridRarityEpic: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid unlocked={[achievementEpicoUnlocked]} locked={[]} />
  </div>
);

export const AchievementsGridRarityLegendary: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid unlocked={[achievementLendarioUnlocked]} locked={[]} />
  </div>
);

export const AchievementsGridManyItems: Story = () => (
  <div className="max-w-3xl p-4">
    <AchievementsGrid
      unlocked={[
        achievementComumUnlocked,
        achievementRaroUnlocked,
        achievementEpicoUnlocked,
        achievementLendarioUnlocked,
        {
          ...achievementComumUnlocked,
          slug: 'a2',
          nome: 'Bem-vindo',
          descricao: 'Entre no sistema pela primeira vez.',
        },
        {
          ...achievementRaroUnlocked,
          slug: 'a3',
          nome: 'Colaborador',
          descricao: 'Ajude 3 colegas com informações de rota.',
        },
      ]}
      locked={[
        achievementLockedComProgress,
        achievementLockedNoProgress,
        achievementLockedFullProgress,
        achievementLockedZeroProgress,
        achievementReserved,
        {
          ...achievementLockedComProgress,
          slug: 'l2',
          nome: 'Noturno',
          descricao: 'Registre 5 rotas após as 20h.',
          progressPercent: 60,
        },
      ]}
    />
  </div>
);

// ---------------------------------------------------------------------------
// ContributionHeatmap stories
// ---------------------------------------------------------------------------

export const ContributionHeatmapEmpty: Story = () => (
  <div className="max-w-2xl p-4">
    <ContributionHeatmap history={emptyHistory} />
  </div>
);

export const ContributionHeatmapSparse: Story = () => (
  <div className="max-w-2xl p-4">
    <ContributionHeatmap history={sparseHistory} />
  </div>
);

export const ContributionHeatmapDense: Story = () => (
  <div className="max-w-2xl p-4">
    <ContributionHeatmap history={denseHistory} />
  </div>
);

export const ContributionHeatmapAllIntensityLevels: Story = () => (
  <div className="max-w-2xl p-4">
    <p className="mb-2 text-xs text-gray-500">
      Primeiros itens cobrem todos os níveis: vazio, comum, raro, épico e lendário.
    </p>
    <ContributionHeatmap history={allIntensityHistory} />
  </div>
);

export const ContributionHeatmapSingleDay: Story = () => (
  <div className="max-w-2xl p-4">
    <ContributionHeatmap history={[{ date: '2026-06-19', points: 75, count: 10 }]} />
  </div>
);

export const ContributionHeatmapLegendaryOnly: Story = () => (
  <div className="max-w-2xl p-4">
    <ContributionHeatmap history={makeDays(Array(30).fill({ points: 60, count: 8 }))} />
  </div>
);

export const ContributionHeatmapEpicOnly: Story = () => (
  <div className="max-w-2xl p-4">
    <ContributionHeatmap history={makeDays(Array(30).fill({ points: 25, count: 4 }))} />
  </div>
);

export const ContributionHeatmapRareOnly: Story = () => (
  <div className="max-w-2xl p-4">
    <ContributionHeatmap history={makeDays(Array(30).fill({ points: 12, count: 2 }))} />
  </div>
);

export const ContributionHeatmapCommonOnly: Story = () => (
  <div className="max-w-2xl p-4">
    <ContributionHeatmap history={makeDays(Array(30).fill({ points: 5, count: 1 }))} />
  </div>
);

// ---------------------------------------------------------------------------
// PointDeltaToast stories
// ---------------------------------------------------------------------------

export const PointDeltaToastNull: Story = () => (
  <div className="relative h-40 p-4">
    <p className="text-sm text-gray-500">Nenhum toast renderizado (event=null).</p>
    <PointDeltaToast event={null} />
  </div>
);

export const PointDeltaToastLowPoints: Story = () => (
  <div className="relative h-40 p-4">
    <PointDeltaToast event={eventLowPoints} />
  </div>
);

export const PointDeltaToastMediumPoints: Story = () => (
  <div className="relative h-40 p-4">
    <PointDeltaToast event={eventMediumPoints} />
  </div>
);

export const PointDeltaToastHighPoints: Story = () => (
  <div className="relative h-40 p-4">
    <PointDeltaToast event={eventHighPoints} />
  </div>
);

export const PointDeltaToastLongMessage: Story = () => (
  <div className="relative h-40 p-4">
    <PointDeltaToast event={eventLongMessage} />
  </div>
);

export const PointDeltaToastShortMessage: Story = () => (
  <div className="relative h-40 p-4">
    <PointDeltaToast event={{ points: 10, message: 'Rota salva.' }} />
  </div>
);

// ---------------------------------------------------------------------------
// Named exports order

