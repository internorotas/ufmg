import { LockKeyhole, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { AchievementView } from '@/features/profile/api/profileClient';

interface AchievementsGridProps {
  unlocked: AchievementView[];
  locked: AchievementView[];
}

function rarityToVariant(rarity: AchievementView['rarity']) {
  switch (rarity) {
    case 'legendary':
      return 'lendario';
    case 'epic':
      return 'epico';
    case 'rare':
      return 'raro';
    default:
      return 'comum';
  }
}

function renderAchievementCard(achievement: AchievementView, unlocked: boolean) {
  return (
    <article
      key={achievement.slug}
      className={`rounded-xl border px-3 py-3 ${
        unlocked ? 'border-card-border bg-card' : 'border-card-border bg-background-secondary/70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 rounded-full border p-2 ${
              unlocked
                ? 'border-card-border bg-background'
                : 'border-card-border bg-background-secondary'
            }`}
          >
            {unlocked ? (
              <Medal size={16} aria-hidden="true" />
            ) : (
              <LockKeyhole size={16} aria-hidden="true" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text-primary">{achievement.nome}</p>
            <p className="text-xs text-text-secondary">{achievement.descricao}</p>
          </div>
        </div>
        <Badge variant={rarityToVariant(achievement.rarity)} size="xs">
          {achievement.rarity}
        </Badge>
      </div>
      <p className="mt-3 text-xs text-text-tertiary">{achievement.criteriaText}</p>
      {!unlocked && achievement.progressPercent !== null ? (
        <div className="mt-3 space-y-1">
          <div className="h-2 rounded-full bg-background">
            <div
              className="h-2 rounded-full bg-brand-primary"
              style={{ width: `${achievement.progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-text-tertiary">
            Progresso: {achievement.progressPercent}%
          </p>
        </div>
      ) : null}
      {achievement.isReserved ? (
        <p className="mt-2 text-[11px] font-medium text-text-tertiary">
          Reservado para fases futuras.
        </p>
      ) : null}
    </article>
  );
}

export function AchievementsGrid({ unlocked, locked }: AchievementsGridProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Desbloqueados</h3>
          <Badge variant="ouro" size="xs">
            {unlocked.length}
          </Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {unlocked.map((item) => renderAchievementCard(item, true))}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Em progresso</h3>
          <Badge variant="neutral" size="xs">
            {locked.length}
          </Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {locked.map((item) => renderAchievementCard(item, false))}
        </div>
      </div>
    </div>
  );
}
