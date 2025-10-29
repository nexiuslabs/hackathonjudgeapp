import { Clock, Loader2, Radio, RefreshCw, ShieldAlert, SignalHigh, WifiOff } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RankingsConnectionState, RankingsSnapshotSource } from '@/types/rankings';

export interface RankingsHeaderProps {
  lastUpdated: Date | null;
  isLocked: boolean;
  unlockMessage?: string | null;
  unlockEta?: Date | null;
  judgesCompleted?: number | null;
  totalJudges?: number | null;
  isOffline: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  source: RankingsSnapshotSource | null;
  connectionState: RankingsConnectionState;
  hasRealtime: boolean;
  onRefresh?: () => void;
}

function formatRelativeTime(date: Date | null): string {
  if (!date) {
    return 'Awaiting first sync';
  }

  const diff = Date.now() - date.getTime();

  if (diff < 60_000) {
    return 'Updated moments ago';
  }

  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) {
    return `Updated ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.round(minutes / 60);
  return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`;
}

function describeConnection(state: RankingsConnectionState, hasRealtime: boolean) {
  if (!hasRealtime && state === 'idle') {
    return 'Realtime standby';
  }

  switch (state) {
    case 'connecting':
      return 'Connecting…';
    case 'open':
      return 'Live updates active';
    case 'closed':
      return 'Realtime paused';
    case 'error':
      return 'Realtime unavailable';
    default:
      return 'Realtime standby';
  }
}

function describeSource(source: RankingsSnapshotSource | null) {
  switch (source) {
    case 'cache':
      return 'Cached snapshot';
    case 'fallback':
      return 'Offline sample data';
    case 'realtime':
      return 'Realtime';
    case 'network':
      return 'Latest sync';
    default:
      return 'Unknown source';
  }
}

export function RankingsHeader({
  lastUpdated,
  isLocked,
  unlockMessage,
  unlockEta,
  judgesCompleted,
  totalJudges,
  isOffline,
  isRefreshing,
  isStale,
  source,
  connectionState,
  hasRealtime,
  onRefresh,
}: RankingsHeaderProps) {
  const connectionLabel = describeConnection(connectionState, hasRealtime);
  const sourceLabel = describeSource(source);
  const progressCopy =
    typeof judgesCompleted === 'number' && typeof totalJudges === 'number'
      ? `${judgesCompleted} of ${totalJudges} judges submitted`
      : null;

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-3 text-2xl">
            Live rankings
            {isLocked ? (
              <Badge variant="warning" aria-live="polite">
                Locked for judges
              </Badge>
            ) : (
              <Badge variant="success" aria-live="polite">
                Visible to judges
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="max-w-2xl text-base text-neutral-300">
            Monitor weighted totals as ballots sync. Operations can refresh manually, while judges receive an unlock banner once
            the panel completes submissions.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4 text-neutral-400" aria-hidden="true" />
              {formatRelativeTime(lastUpdated)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Radio className="h-4 w-4 text-neutral-400" aria-hidden="true" />
              {connectionLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <SignalHigh className="h-4 w-4 text-neutral-400" aria-hidden="true" />
              {sourceLabel}
            </span>
            {isStale ? (
              <Badge variant="warning" aria-live="polite">
                Data may be stale — refresh recommended
              </Badge>
            ) : null}
            {isOffline ? (
              <span className="inline-flex items-center gap-1 text-amber-300" role="alert">
                <WifiOff className="h-4 w-4" aria-hidden="true" /> Offline mode
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:w-48">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-surface-border/70 bg-surface-elevated/60 px-3 py-2 text-sm font-medium text-neutral-100 transition hover:border-brand-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            Refresh feed
          </button>
          {progressCopy ? (
            <p className="rounded-lg border border-surface-border/50 bg-surface-highlight/20 p-3 text-xs text-neutral-300">
              {progressCopy}
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-neutral-200">
        {isLocked ? (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-100" role="status">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium">Rankings hidden from judges until unlock.</p>
              <p className="text-xs text-amber-100/80">
                {unlockMessage ?? 'Operations will release standings when all ballots are reconciled.'}
                {unlockEta ? ` Target unlock: ${unlockEta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-100" role="status">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium">Judges can now view standings.</p>
              <p className="text-xs text-emerald-100/80">
                {unlockMessage ?? 'Toast notifications alert the panel when rankings unlock.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
