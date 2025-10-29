import { Fragment } from 'react';

import { ScoreSliderCard, type ScoreFieldStatus } from './ScoreSliderCard';

import type { ScoringCriterion } from '@/types/scoring';

export interface ScoreCriteriaListProps {
  criteria: ScoringCriterion[];
  scores: Record<string, number | undefined>;
  statusMap: Record<string, ScoreFieldStatus>;
  onScoreChange: (criterionId: string, value: number) => void;
  onFirstInteraction: (criterionId: string) => void;
}

export function ScoreCriteriaList({
  criteria,
  scores,
  statusMap,
  onScoreChange,
  onFirstInteraction,
}: ScoreCriteriaListProps) {
  if (!criteria.length) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-border/60 bg-surface-base/40 p-6 text-center">
        <p className="text-base font-semibold text-white">No scoring criteria assigned yet</p>
        <p className="mt-2 text-sm text-neutral-300">
          Once operations publishes the rubric, your scoring canvas will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {criteria.map((criterion) => (
        <Fragment key={criterion.id}>
          <ScoreSliderCard
            criterion={criterion}
            value={scores[criterion.id]}
            status={statusMap[criterion.id] ?? 'pristine'}
            onFirstInteraction={() => onFirstInteraction(criterion.id)}
            onChange={(nextValue) => onScoreChange(criterion.id, nextValue)}
          />
        </Fragment>
      ))}
    </div>
  );
}
