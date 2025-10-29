import { Lock, UsersRound } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface LockedRankingNoticeProps {
  judgesCompleted?: number | null;
  totalJudges?: number | null;
  unlockMessage?: string | null;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
}

export function LockedRankingNotice({
  judgesCompleted,
  totalJudges,
  unlockMessage,
  lastUpdated,
  onRefresh,
}: LockedRankingNoticeProps) {
  const progress =
    typeof judgesCompleted === 'number' && typeof totalJudges === 'number' && totalJudges > 0
      ? Math.min(100, Math.round((judgesCompleted / totalJudges) * 100))
      : null;

  return (
    <Card className="bg-surface-base/70">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Lock className="h-5 w-5 text-amber-300" aria-hidden="true" /> Rankings locked for judges
          </CardTitle>
          <CardDescription className="text-sm text-neutral-300">
            {unlockMessage ??
              'Once every ballot is submitted, operations will trigger an unlock and judges receive a toast with direct access.'}
          </CardDescription>
          {lastUpdated ? (
            <p className="text-xs text-neutral-400">Last sync recorded at {lastUpdated.toLocaleTimeString()}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="self-start rounded-lg border border-surface-border/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-100 transition hover:border-brand-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          Refresh progress
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
          <UsersRound className="h-5 w-5" aria-hidden="true" />
          <div>
            {typeof judgesCompleted === 'number' && typeof totalJudges === 'number' ? (
              <p className="font-semibold text-amber-100">
                {judgesCompleted} of {totalJudges} judges have finalised ballots.
              </p>
            ) : (
              <p className="font-semibold text-amber-100">Waiting for final ballot submissions.</p>
            )}
            <p className="text-xs text-amber-100/80">
              Judges see a locked banner until operations confirms every ballot is synced. Use the refresh button to double-check progress
              if teams report discrepancies.
            </p>
          </div>
        </div>
        {progress !== null ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Completion</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-elevated/60">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Judge completion progress"
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
