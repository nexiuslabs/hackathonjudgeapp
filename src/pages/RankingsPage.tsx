import { AlertTriangle, CloudOff } from 'lucide-react';

import { LockedRankingNotice } from '@/components/rankings/LockedRankingNotice';
import { RankingsCards } from '@/components/rankings/RankingsCards';
import { RankingsHeader } from '@/components/rankings/RankingsHeader';
import { RankingsTable } from '@/components/rankings/RankingsTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRankingsFeed } from '@/hooks/useRankingsFeed';

const EVENT_ID = 'demo-event';

function RankingsSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      <div className="h-40 animate-pulse rounded-xl bg-surface-elevated/40" />
      <div className="hidden h-64 animate-pulse rounded-xl bg-surface-elevated/40 lg:block" />
      <div className="grid gap-3 lg:hidden">
        <div className="h-40 animate-pulse rounded-xl bg-surface-elevated/40" />
        <div className="h-40 animate-pulse rounded-xl bg-surface-elevated/40" />
      </div>
    </div>
  );
}

function RankingsEmptyState() {
  return (
    <Card className="bg-surface-base/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <CloudOff className="h-5 w-5 text-neutral-400" aria-hidden="true" />
          No rankings yet
        </CardTitle>
        <CardDescription className="text-neutral-300">
          Once the first ballots sync, standings will appear automatically. Use the refresh control if you expect submissions but do
          not see any teams listed.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function RankingsErrorState({ message }: { message: string }) {
  return (
    <Card className="border border-rose-500/40 bg-rose-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertTriangle className="h-5 w-5 text-rose-200" aria-hidden="true" />
          Unable to load rankings
        </CardTitle>
        <CardDescription className="text-rose-100/80">{message}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-rose-100">
        <p>
          Verify your network connection or retry shortly. Cached standings remain available offline, but manual refresh may be needed once
          you reconnect.
        </p>
      </CardContent>
    </Card>
  );
}

export function RankingsPage() {
  const {
    entries,
    isLoading,
    isRefreshing,
    error,
    isOffline,
    isLocked,
    source,
    lastUpdated,
    unlockMessage,
    unlockEta,
    judgesCompleted,
    totalJudges,
    isStale,
    connectionState,
    hasRealtime,
    refresh,
  } = useRankingsFeed({ eventId: EVENT_ID });

  const showSkeleton = isLoading && entries.length === 0;
  const showEmpty = !isLoading && !error && entries.length === 0;

  return (
    <section className="flex flex-col gap-6" aria-labelledby="rankings-heading">
      <h1 id="rankings-heading" className="sr-only">
        Live rankings
      </h1>
      <RankingsHeader
        lastUpdated={lastUpdated}
        isLocked={isLocked}
        unlockMessage={unlockMessage}
        unlockEta={unlockEta}
        judgesCompleted={judgesCompleted}
        totalJudges={totalJudges}
        isOffline={isOffline}
        isRefreshing={isRefreshing}
        isStale={isStale}
        source={source}
        connectionState={connectionState}
        hasRealtime={hasRealtime}
        onRefresh={refresh}
      />

      {showSkeleton ? <RankingsSkeleton /> : null}

      {error && !showSkeleton ? <RankingsErrorState message={error.message} /> : null}

      {isLocked ? (
        <LockedRankingNotice
          judgesCompleted={judgesCompleted}
          totalJudges={totalJudges}
          unlockMessage={unlockMessage}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
        />
      ) : null}

      {entries.length ? (
        <>
          <RankingsTable entries={entries} />
          <RankingsCards entries={entries} />
        </>
      ) : null}

      {showEmpty ? <RankingsEmptyState /> : null}
    </section>
  );
}
