import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BellRing,
  Clock4,
  CloudFog,
  Layers,
  RefreshCw,
  ShieldCheck,
  SignalHigh,
  Timer,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminEventContext } from '@/contexts/AdminEventContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import type { PermissionRole } from '@/types/permissions';

const roleLabels: Partial<Record<PermissionRole, string>> = {
  judge: 'Judge',
  head_judge: 'Head judge',
  operations: 'Operations',
  admin: 'Admin',
  owner: 'Owner',
};

function formatSchedule(startAt: string | null, endAt: string | null, timezone: string | null): string {
  if (!startAt && !endAt) {
    return 'Schedule pending';
  }

  const locale = typeof window !== 'undefined' ? window.navigator.language : 'en-US';
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };
  const tzOptions = timezone ? { timeZone: timezone } : {};

  if (startAt && endAt) {
    const start = new Date(startAt);
    const end = new Date(endAt);
    const sameDay = start.toDateString() === end.toDateString();
    const dateFormatter = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', ...tzOptions });
    const timeFormatter = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', ...tzOptions });

    if (sameDay) {
      const dateLabel = dateFormatter.format(start);
      const startLabel = timeFormatter.format(start);
      const endLabel = timeFormatter.format(end);
      return `${dateLabel}, ${startLabel} – ${endLabel}${timezone ? ` (${timezone})` : ''}`;
    }

    const startLabel = new Intl.DateTimeFormat(locale, { ...options, ...tzOptions }).format(start);
    const endLabel = new Intl.DateTimeFormat(locale, { ...options, ...tzOptions }).format(end);
    return `${startLabel} → ${endLabel}${timezone ? ` (${timezone})` : ''}`;
  }

  const target = new Date(startAt ?? endAt ?? Date.now());
  return `${new Intl.DateTimeFormat(locale, { ...options, ...tzOptions }).format(target)}${timezone ? ` (${timezone})` : ''}`;
}

function formatRelativeTime(value: Date): string {
  const diffMs = Date.now() - value.getTime();
  const diffSeconds = Math.round(diffMs / 1000);

  if (Math.abs(diffSeconds) < 60) {
    return `${Math.max(diffSeconds, 0)}s ago`;
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function AdminPage() {
  const { event, isLoading, isFallback, error, lastLoadedAt, refresh } = useAdminEventContext();
  const permissions = usePermissions();

  const scheduleLabel = useMemo(
    () => formatSchedule(event?.startAt ?? null, event?.endAt ?? null, event?.timezone ?? null),
    [event?.endAt, event?.startAt, event?.timezone],
  );

  const lastLoadedLabel = useMemo(() => {
    if (!lastLoadedAt) {
      return 'Awaiting sync';
    }

    return `${formatRelativeTime(lastLoadedAt)} · ${lastLoadedAt.toLocaleTimeString()}`;
  }, [lastLoadedAt]);

  const panelLabel = event?.totalJudges ? `${event.totalJudges} judges` : 'Panel sizing pending';
  const teamsLabel = event?.totalTeams ? `${event.totalTeams} finalists` : 'Teams pending';

  const roleLabel = permissions.role ? roleLabels[permissions.role] ?? permissions.role : 'Unknown role';

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-surface-border/70 bg-surface-elevated/80 p-6 shadow-lg shadow-brand-900/10 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-400">
              <span>Admin console</span>
              {event ? <Badge variant="outline">{event.code ?? event.id}</Badge> : null}
              {isFallback ? <Badge variant="warning">Offline sample</Badge> : null}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">{event?.name ?? 'Event operations hub'}</h1>
              <p className="max-w-2xl text-sm text-neutral-300">
                Monitor judge progress, approve unlocks, and keep timers on schedule without juggling multiple tabs.
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-surface-border/70 bg-surface-base/60 p-4">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  <Clock4 className="h-4 w-4 text-brand-200" aria-hidden="true" />
                  Schedule
                </dt>
                <dd className="mt-2 text-sm text-neutral-100">{scheduleLabel}</dd>
              </div>
              <div className="rounded-2xl border border-surface-border/70 bg-surface-base/60 p-4">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  <SignalHigh className="h-4 w-4 text-emerald-200" aria-hidden="true" />
                  Location
                </dt>
                <dd className="mt-2 text-sm text-neutral-100">{event?.location ?? 'Venue to be announced'}</dd>
              </div>
              <div className="rounded-2xl border border-surface-border/70 bg-surface-base/60 p-4">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  <Users className="h-4 w-4 text-sky-200" aria-hidden="true" />
                  Panel
                </dt>
                <dd className="mt-2 text-sm text-neutral-100">{panelLabel}</dd>
                <dd className="text-xs text-neutral-400">{teamsLabel}</dd>
              </div>
              <div className="rounded-2xl border border-surface-border/70 bg-surface-base/60 p-4 sm:col-span-2 lg:col-span-3 xl:col-span-1">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  <RefreshCw className="h-4 w-4 text-brand-200" aria-hidden="true" />
                  Last sync
                </dt>
                <dd className="mt-2 text-sm text-neutral-100">{lastLoadedLabel}</dd>
              </div>
            </dl>
          </div>

          <aside className="flex w-full max-w-sm flex-col gap-4 text-sm text-neutral-200">
            <div className="rounded-2xl border border-surface-border/70 bg-surface-base/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Signed in as</p>
              <p className="mt-2 text-sm font-medium text-white">
                {permissions.fullName ?? permissions.email ?? 'Administrator'}
              </p>
              <p className="text-xs text-neutral-400">{roleLabel}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                void refresh();
              }}
              disabled={isLoading}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-full border border-surface-border/70 px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                'bg-surface-highlight/60 text-neutral-100 hover:border-brand-400/70 hover:text-white',
                isLoading && 'cursor-wait opacity-70',
              )}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} aria-hidden="true" />
              {isLoading ? 'Refreshing…' : 'Refresh data'}
            </button>

            <Link
              to="/rankings"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-surface-border/70 bg-surface-base/60 px-4 py-2 text-sm font-medium text-white transition hover:border-brand-400/70 hover:text-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Open rankings
            </Link>
          </aside>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Live event metadata is unavailable. Showing the cached demo configuration until the connection recovers.
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card aria-busy={isLoading} className={cn(isLoading && 'animate-pulse')}>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-brand-200" aria-hidden="true" />
                Progress workspace
              </CardTitle>
              <CardDescription>
                Grid and list views for judge × team completion will render here once data hooks are connected.
              </CardDescription>
            </div>
            <Badge variant="outline" className="self-start">Responsive shell</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-dashed border-surface-border/70 bg-surface-base/50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Activity className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  Realtime updates
                </p>
                <p className="mt-2 text-sm text-neutral-300">
                  Supabase channel subscriptions will hydrate the grid and list with low-latency updates.
                </p>
              </div>
              <div className="rounded-xl border border-dashed border-surface-border/70 bg-surface-base/50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <BellRing className="h-4 w-4 text-amber-200" aria-hidden="true" />
                  Unlock queue drawer
                </p>
                <p className="mt-2 text-sm text-neutral-300">
                  Pending unlock requests and audit trail will live in a swipeable drawer on tablet and phone.
                </p>
              </div>
              <div className="rounded-xl border border-dashed border-surface-border/70 bg-surface-base/50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <CloudFog className="h-4 w-4 text-brand-200" aria-hidden="true" />
                  Offline state cues
                </p>
                <p className="mt-2 text-sm text-neutral-300">
                  Connectivity banners mirror the scoring app so admins know when actions are read-only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card aria-busy={isLoading} className={cn(isLoading && 'animate-pulse')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-sky-200" aria-hidden="true" />
                Timer controls
              </CardTitle>
              <CardDescription>Shared timer actions will dock here for quick start, pause, and reset.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-300">
                Integrate the Supabase `admin_timer_state` RPCs to drive countdowns and broadcast drift corrections.
              </p>
            </CardContent>
          </Card>

          <Card aria-busy={isLoading} className={cn(isLoading && 'animate-pulse')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-200" aria-hidden="true" />
                Event lock overview
              </CardTitle>
              <CardDescription>Lock status, pending actions, and export links surface here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-300">
                Wire up Supabase RPCs for approving unlocks and toggling the event lock once backend endpoints land.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
