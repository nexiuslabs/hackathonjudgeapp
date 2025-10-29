import { Award, Users } from 'lucide-react';

import { BriefSection } from './BriefSection';

import { offlineBriefSnapshot } from '@/config/offline-content';

interface RosterSectionProps {
  id: 'judges' | 'finalists';
  title: string;
  description: string;
}

export function RosterSection({ id, title, description }: RosterSectionProps) {
  if (id === 'judges') {
    const roster = offlineBriefSnapshot.judges;
    return (
      <BriefSection id={id} title={title} description={description}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roster.map((entry) => (
            <article
              key={entry.id}
              className="flex h-full flex-col gap-3 rounded-xl border border-surface-border/60 bg-surface-base/80 p-4"
              aria-label={`${entry.name}, ${entry.role}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{entry.name}</p>
                  <p className="text-xs uppercase tracking-wide text-brand-200">{entry.role}</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-200">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="text-sm text-neutral-300">{entry.expertise}</p>
            </article>
          ))}
        </div>
      </BriefSection>
    );
  }

  const roster = offlineBriefSnapshot.finalists;
  return (
    <BriefSection id={id} title={title} description={description}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {roster.map((entry) => (
          <article
            key={entry.id}
            className="flex h-full flex-col gap-3 rounded-xl border border-surface-border/60 bg-surface-base/80 p-4"
            aria-label={`${entry.team} — ${entry.project}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{entry.team}</p>
                <p className="text-xs uppercase tracking-wide text-brand-200">{entry.track}</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-200">
                <Award className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="text-sm text-neutral-300">{entry.project}</p>
          </article>
        ))}
      </div>
    </BriefSection>
  );
}
