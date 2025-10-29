export type RankingsSnapshotSource = 'network' | 'realtime' | 'cache' | 'fallback';

export interface RankingCriterionScore {
  criterionId: string;
  label: string;
  averageScore: number;
  weight?: number | null;
}

export interface RankingEntry {
  teamId: string;
  teamName: string;
  totalScore: number;
  rank: number;
  deltaToPrev?: number | null;
  submittedCount?: number | null;
  criterionScores: RankingCriterionScore[];
}

export interface RankingsSnapshot {
  eventId: string;
  fetchedAt: string;
  entries: RankingEntry[];
  isUnlocked: boolean;
  unlockMessage?: string | null;
  unlockedAt?: string | null;
  unlockEta?: string | null;
  judgesCompleted?: number | null;
  totalJudges?: number | null;
  source: RankingsSnapshotSource;
}

export type RankingsConnectionState = 'idle' | 'connecting' | 'open' | 'closed' | 'error';
