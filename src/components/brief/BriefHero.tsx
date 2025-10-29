import { type ComponentType, type SVGProps } from 'react';

import { CalendarDays, CloudOff, RefreshCw, Target } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { offlineBriefSnapshot } from '@/config/offline-content';
import { cn } from '@/lib/utils';

const calloutIconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  criteria: Target,
  timekeeping: CalendarDays,
  support: RefreshCw,
};

function getCalloutIcon(id: string) {
  return calloutIconMap[id] ?? CloudOff;
}

export function BriefHero() {
  const { title, summary, callouts, updatedAt, cta } = offlineBriefSnapshot;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="relative space-y-4">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-500/20 via-surface-highlight/40 to-transparent" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl text-white">{title}</CardTitle>
            <CardDescription className="text-sm text-neutral-200">
              Cached for offline access · Last updated{' '}
              <time dateTime={updatedAt}>{new Date(updatedAt).toLocaleString()}</time>
            </CardDescription>
          </div>
          <a
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-400/60',
              'bg-brand-500/20 px-4 py-2 text-sm font-semibold text-brand-100 transition sm:w-auto',
              'hover:bg-brand-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80'
            )}
            href={cta.href}
          >
            {cta.label}
          </a>
        </div>
        <p className="max-w-3xl text-sm text-neutral-100 sm:text-base">{summary}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {callouts.map((callout) => {
            const Icon = getCalloutIcon(callout.id);
            return (
              <div
                key={callout.id}
                className="flex items-start gap-3 rounded-lg border border-surface-border/60 bg-surface-base/70 p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="font-medium text-white">{callout.label}</p>
                  <p className="text-sm text-neutral-300">{callout.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-neutral-400">{cta.description}</p>
      </CardContent>
    </Card>
  );
}
