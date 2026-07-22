import type { ContributionHistoryPoint } from '@/features/profile/api/profileClient';

interface ContributionHeatmapProps {
  history: ContributionHistoryPoint[];
}

function resolveHeatLevel(points: number): string {
  if (points >= 50) {
    return 'bg-[var(--heatmap-level-4-bg)] border-[var(--heatmap-level-4-border)]';
  }
  if (points >= 20) {
    return 'bg-[var(--heatmap-level-3-bg)] border-[var(--heatmap-level-3-border)]';
  }
  if (points >= 10) {
    return 'bg-[var(--heatmap-level-2-bg)] border-[var(--heatmap-level-2-border)]';
  }
  if (points > 0) {
    return 'bg-[var(--heatmap-level-1-bg)] border-[var(--heatmap-level-1-border)]';
  }
  return 'bg-background border-card-border';
}

export function ContributionHeatmap({ history }: ContributionHeatmapProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-10 gap-2 sm:grid-cols-15">
        {history.map((item) => (
          <div key={item.date} title={`${item.date}: ${item.points} pts em ${item.count} eventos`}>
            <div className={`h-8 rounded border ${resolveHeatLevel(item.points)}`} />
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
