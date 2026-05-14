import type { ContributionHistoryPoint } from '@/features/profile/api/profileClient';

interface ContributionHeatmapProps {
  history: ContributionHistoryPoint[];
}

function resolveHeatLevel(points: number): string {
  if (points >= 50) {
    return 'bg-[var(--gamification-rarity-legendary-bg)] border-[var(--gamification-rarity-legendary-border)]';
  }
  if (points >= 20) {
    return 'bg-[var(--gamification-rarity-epic-bg)] border-[var(--gamification-rarity-epic-border)]';
  }
  if (points >= 10) {
    return 'bg-[var(--gamification-rarity-rare-bg)] border-[var(--gamification-rarity-rare-border)]';
  }
  if (points > 0) {
    return 'bg-[var(--gamification-rarity-common-bg)] border-[var(--gamification-rarity-common-border)]';
  }
  return 'bg-background border-card-border';
}

export function ContributionHeatmap({ history }: ContributionHeatmapProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-10 gap-2 sm:grid-cols-15">
        {history.map((item) => (
          <div key={item.date} title={`${item.date}: ${item.points} pts em ${item.count} eventos`}>
            <div className={`h-8 rounded-lg border ${resolveHeatLevel(item.points)}`} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>Últimos 30 dias</span>
        <span>Mais intenso = mais pontos</span>
      </div>
    </div>
  );
}
