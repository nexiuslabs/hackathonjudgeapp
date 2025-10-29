import { describe, expect, it } from 'vitest';

import { calculateWeightedTotal } from '@/lib/api';
import type { ScoringCriterion } from '@/types/scoring';

const sampleCriteria: ScoringCriterion[] = [
  {
    id: 'innovation',
    label: 'Innovation',
    helperText: 'Novelty and differentiation.',
    weight: 0.3,
    order: 0,
    minScore: 1,
    maxScore: 10,
  },
  {
    id: 'ux',
    label: 'User experience',
    helperText: 'Delightful flow.',
    weight: 0.3,
    order: 1,
    minScore: 1,
    maxScore: 10,
  },
  {
    id: 'technical',
    label: 'Technical depth',
    helperText: 'Engineering quality.',
    weight: 0.3,
    order: 2,
    minScore: 1,
    maxScore: 10,
  },
  {
    id: 'story',
    label: 'Storytelling',
    helperText: 'Narrative strength.',
    weight: 0.1,
    order: 3,
    minScore: 1,
    maxScore: 10,
  },
];

describe('calculateWeightedTotal', () => {
  it('computes the weighted total scaled to 100', () => {
    const total = calculateWeightedTotal(sampleCriteria, {
      innovation: 9,
      ux: 8,
      technical: 7,
      story: 10,
    });

    expect(total).toBeCloseTo(80.0);
  });

  it('ignores criteria without a value', () => {
    const total = calculateWeightedTotal(sampleCriteria, {
      innovation: 10,
      ux: undefined,
      technical: 10,
      story: undefined,
    });

    expect(total).toBeCloseTo(60.0);
  });

  it('clamps scores to the defined min and max', () => {
    const total = calculateWeightedTotal(sampleCriteria, {
      innovation: 15,
      ux: 0,
      technical: 11,
      story: 10,
    });

    expect(total).toBeCloseTo(70.0);
  });
});
