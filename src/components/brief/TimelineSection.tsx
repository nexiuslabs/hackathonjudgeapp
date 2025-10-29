import { Flag, ListChecks, Rocket, Telescope } from 'lucide-react';

import { BriefSection } from './BriefSection';

import { offlineBriefSnapshot } from '@/config/offline-content';

const timelineIcons = [Telescope, ListChecks, Flag, Rocket];

export function TimelineSection() {
  return (
    <BriefSection
      id="flow"
      title="Judging flow"
      description="Follow these steps for each pitch block. The scoring workspace links directly into the relevant stage."
    >
      <ol className="space-y-4">
        {offlineBriefSnapshot.flow.map((step, index) => {
          const Icon = timelineIcons[index % timelineIcons.length]!;
          return (
            <li
              key={step.id}
              className="flex flex-col gap-3 rounded-xl border border-surface-border/60 bg-surface-base/80 p-4 md:flex-row md:items-start md:gap-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-200">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold uppercase tracking-wide text-neutral-100">Step {index + 1}</p>
                  <p className="text-base font-semibold text-white">{step.title}</p>
                </div>
                <p className="text-sm text-neutral-300">{step.description}</p>
                {step.helper ? <p className="text-xs text-brand-200">{step.helper}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </BriefSection>
  );
}
