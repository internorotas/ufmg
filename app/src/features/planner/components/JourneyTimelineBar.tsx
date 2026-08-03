import { Bus } from 'lucide-react';
import type { PlannerBusLeg, PlannerRouteLeg } from '../types';

interface JourneyTimelineBarProps {
  legs: PlannerRouteLeg[];
  totalMinutes: number;
}

export function JourneyTimelineBar({ legs, totalMinutes }: JourneyTimelineBarProps) {
  const busLegs = legs.filter((l): l is PlannerBusLeg => l.kind === 'bus');

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-background-secondary">
        {legs.map((leg) => {
          const pct = Math.max((leg.minutes / totalMinutes) * 100, 3);
          const segKey = `${leg.kind}-${leg.fromStopId}-${leg.toStopId}`;
          return (
            <div
              key={segKey}
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                backgroundColor:
                  leg.kind === 'bus'
                    ? (leg as PlannerBusLeg).lineColorHex
                    : 'var(--color-text-tertiary)',
                opacity: leg.kind === 'walk' ? 0.35 : 1,
              }}
            />
          );
        })}
      </div>
      {busLegs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {busLegs.map((leg) => (
            <span
              key={`${leg.lineId}-${leg.fromStopId}`}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-bold text-text-primary"
              style={{
                backgroundColor: `${leg.lineColorHex}18`,
                border: `1px solid ${leg.lineColorHex}30`,
              }}
            >
              <Bus size={9} aria-hidden="true" />
              {leg.lineName}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
