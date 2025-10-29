import { Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { RankingEntry } from '@/types/rankings';

export interface RankingsCardsProps {
  entries: RankingEntry[];
}

function formatScore(value: number) {
  return value.toFixed(1);
}

function formatDelta(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value) || value === 0) {
    return 'No change';
  }
  return `${value > 0 ? '▲' : '▼'} ${Math.abs(value).toFixed(1)}`;
}

export function RankingsCards({ entries }: RankingsCardsProps) {
  return (
    <div className="grid gap-4 lg:hidden" role="list" aria-label="Live rankings cards">
      {entries.map((entry) => (
        <Card key={entry.teamId}>
          <article role="listitem" aria-label={`Rank ${entry.rank}: ${entry.teamName}`} className="flex flex-col gap-3">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1 text-sm">
                  #{entry.rank}
                  {entry.rank === 1 ? <Trophy className="h-4 w-4 text-amber-300" aria-hidden="true" /> : null}
                </Badge>
                <CardTitle className="text-xl text-white">{entry.teamName}</CardTitle>
              </div>
              <Badge variant="success" className="gap-1 text-sm">
                {formatScore(entry.totalScore)} total
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-300">
                <span className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-surface-highlight/40 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-200">
                    {formatDelta(entry.deltaToPrev ?? null)}
                  </span>
                  <span>{entry.submittedCount ?? '—'} ballots synced</span>
                </span>
              </div>
              {entry.criterionScores.length ? (
                <div className="flex flex-wrap gap-2">
                  {entry.criterionScores.slice(0, 3).map((score) => (
                    <Badge key={`${entry.teamId}:${score.criterionId}`} variant="outline" className="gap-1">
                      <span className="font-semibold text-white">{formatScore(score.averageScore)}</span>
                      <span className="text-neutral-300">{score.label}</span>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
              Weighted rubric factors refresh automatically when ballots sync. Tap refresh above to manually verify standings.
            </CardFooter>
          </article>
        </Card>
      ))}
    </div>
  );
}
