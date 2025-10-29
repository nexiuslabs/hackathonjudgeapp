import { offlineBriefSnapshot } from './offline-content';

import type { ScoringCriterion } from '@/types/scoring';

export const DEFAULT_MIN_SCORE = 1;
export const DEFAULT_MAX_SCORE = 10;

export const fallbackScoringCriteria: ScoringCriterion[] = offlineBriefSnapshot.criteria.map((criterion, index) => {
  const numericWeight = parseFloat(criterion.weight.replace('%', '')) / 100;

  return {
    id: criterion.id,
    label: criterion.label,
    helperText: criterion.description,
    weight: Number.isFinite(numericWeight) ? numericWeight : 0,
    order: index,
    defaultValue: null,
    minScore: DEFAULT_MIN_SCORE,
    maxScore: DEFAULT_MAX_SCORE,
  } satisfies ScoringCriterion;
});
