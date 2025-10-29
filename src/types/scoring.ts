export interface ScoringCriterion {
  id: string;
  label: string;
  helperText: string;
  weight: number;
  order: number;
  defaultValue?: number | null;
  minScore?: number;
  maxScore?: number;
}

export interface ScoringCriteriaSnapshot {
  eventId: string;
  criteria: ScoringCriterion[];
  fetchedAt: string;
  source: 'network' | 'cache' | 'fallback';
}
