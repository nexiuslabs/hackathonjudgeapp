import { Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RankingEntry } from '@/types/rankings';

export interface RankingsTableProps {
  entries: RankingEntry[];
}

function formatScore(value: number) {
  return value.toFixed(1);
}

function formatDelta(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  if (value === 0) {
    return '—';
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
}

export function RankingsTable({ entries }: RankingsTableProps) {
  return (
    <div className="hidden lg:block">
      <Table role="table" aria-label="Live rankings">
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-20">
              Rank
            </TableHead>
            <TableHead scope="col">Team</TableHead>
            <TableHead scope="col" className="w-32 text-right">
              Total
            </TableHead>
            <TableHead scope="col" className="w-32 text-right">
              Δ Prev.
            </TableHead>
            <TableHead scope="col" className="w-32 text-right">
              Submissions
            </TableHead>
            <TableHead scope="col">Highlights</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const topScores = entry.criterionScores.slice(0, 3);
            return (
              <TableRow key={entry.teamId}>
                <TableCell className="text-lg font-semibold">
                  <span className="inline-flex items-center gap-1">
                    #{entry.rank}
                    {entry.rank === 1 ? <Trophy className="h-4 w-4 text-amber-300" aria-hidden="true" /> : null}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">{entry.teamName}</span>
                    {entry.criterionScores.length > 0 ? (
                      <span className="text-xs text-neutral-400">
                        Top strengths: {entry.criterionScores.map((score) => score.label).slice(0, 2).join(', ')}
                        {entry.criterionScores.length > 2 ? '…' : ''}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold text-white">{formatScore(entry.totalScore)}</TableCell>
                <TableCell className="text-right">
                  <span className={entry.deltaToPrev && entry.deltaToPrev > 0 ? 'text-emerald-300' : entry.deltaToPrev && entry.deltaToPrev < 0 ? 'text-rose-300' : 'text-neutral-300'}>
                    {formatDelta(entry.deltaToPrev ?? null)}
                  </span>
                </TableCell>
                <TableCell className="text-right text-neutral-300">{entry.submittedCount ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {topScores.map((score) => (
                      <Badge key={`${entry.teamId}:${score.criterionId}`} variant="outline" className="gap-1">
                        <span className="font-semibold text-white">{formatScore(score.averageScore)}</span>
                        <span className="text-neutral-300">{score.label}</span>
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
