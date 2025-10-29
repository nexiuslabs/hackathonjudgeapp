import { CalendarDays, Clock } from 'lucide-react';

import { BriefSection } from './BriefSection';

import { offlineBriefSnapshot } from '@/config/offline-content';

export function OverviewSection() {
  return (
    <BriefSection
      id="overview"
      title="Event overview"
      description="Keep this itinerary handy to stay synchronized while offline."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-neutral-300">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <p>
              Cached on{' '}
              <time dateTime={offlineBriefSnapshot.updatedAt} className="font-medium text-neutral-100">
                {new Date(offlineBriefSnapshot.updatedAt).toLocaleString()}
              </time>{' '}
              — refresh when connected to ensure the latest updates.
            </p>
          </div>
          <p className="text-sm text-neutral-200">
            Judges can continue referencing this briefing when the device is offline. When you reconnect, the scoring workspace
            automatically syncs content revisions and roster updates.
          </p>
        </div>
        <div className="rounded-xl border border-surface-border/60 bg-surface-elevated/70 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-100">
            <CalendarDays className="h-4 w-4 text-brand-200" aria-hidden="true" />
            Event itinerary
          </div>
          <ul className="space-y-3">
            {offlineBriefSnapshot.schedule.map((item) => (
              <li key={item.id} className="rounded-lg bg-surface-base/80 p-3">
                <p className="text-sm font-semibold text-white">{item.activity}</p>
                <p className="text-xs text-brand-200">{item.time}</p>
                {item.detail ? <p className="mt-1 text-xs text-neutral-300">{item.detail}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </BriefSection>
  );
}
