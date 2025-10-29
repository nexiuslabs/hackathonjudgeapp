import { Gauge, Scale, Sparkles } from 'lucide-react';

import { BriefSection } from './BriefSection';

import { offlineBriefSnapshot } from '@/config/offline-content';

const iconCycle = [Sparkles, Gauge, Scale, Sparkles];

export function CriteriaSection() {
  return (
    <BriefSection
      id="criteria"
      title="Judging criteria"
      description="Scores auto-calculate based on these weightings. Calibrate during the first session to stay aligned."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {offlineBriefSnapshot.criteria.map((criterion, index) => {
          const Icon = iconCycle[index % iconCycle.length]!;
          return (
            <div
              key={criterion.id}
              className="flex h-full flex-col gap-3 rounded-xl border border-surface-border/60 bg-surface-base/80 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/15 text-brand-200">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold text-white">{criterion.label}</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-200">
                  {criterion.weight}
                </span>
              </div>
              <p className="text-sm text-neutral-300">{criterion.description}</p>
            </div>
          );
        })}
      </div>
    </BriefSection>
  );
}
