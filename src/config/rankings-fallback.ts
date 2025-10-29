import type { RankingsSnapshot } from '@/types/rankings';

export const fallbackRankingsSnapshot: RankingsSnapshot = {
  eventId: 'demo-event',
  fetchedAt: '2024-02-01T00:00:00.000Z',
  isUnlocked: true,
  unlockMessage:
    'Rankings are based on the most recent synced ballots. Connect to refresh and confirm nothing has shifted.',
  unlockedAt: '2024-02-01T00:00:00.000Z',
  judgesCompleted: 18,
  totalJudges: 18,
  source: 'fallback',
  entries: [
    {
      teamId: 'aurora-grid',
      teamName: 'Team Aurora',
      rank: 1,
      totalScore: 92.4,
      deltaToPrev: null,
      submittedCount: 18,
      criterionScores: [
        { criterionId: 'innovation', label: 'Innovation', averageScore: 9.5, weight: 0.3 },
        { criterionId: 'usability', label: 'User experience', averageScore: 9.2, weight: 0.3 },
        { criterionId: 'technical', label: 'Technical depth', averageScore: 9.4, weight: 0.3 },
        { criterionId: 'story', label: 'Storytelling', averageScore: 8.7, weight: 0.1 },
      ],
    },
    {
      teamId: 'atlas-health',
      teamName: 'Atlas Health',
      rank: 2,
      totalScore: 88.9,
      deltaToPrev: -3.5,
      submittedCount: 18,
      criterionScores: [
        { criterionId: 'innovation', label: 'Innovation', averageScore: 8.9, weight: 0.3 },
        { criterionId: 'usability', label: 'User experience', averageScore: 9.1, weight: 0.3 },
        { criterionId: 'technical', label: 'Technical depth', averageScore: 8.8, weight: 0.3 },
        { criterionId: 'story', label: 'Storytelling', averageScore: 8.4, weight: 0.1 },
      ],
    },
    {
      teamId: 'lumen-ai',
      teamName: 'Lumen AI',
      rank: 3,
      totalScore: 84.7,
      deltaToPrev: -4.2,
      submittedCount: 18,
      criterionScores: [
        { criterionId: 'innovation', label: 'Innovation', averageScore: 8.4, weight: 0.3 },
        { criterionId: 'usability', label: 'User experience', averageScore: 8.3, weight: 0.3 },
        { criterionId: 'technical', label: 'Technical depth', averageScore: 8.9, weight: 0.3 },
        { criterionId: 'story', label: 'Storytelling', averageScore: 8.1, weight: 0.1 },
      ],
    },
    {
      teamId: 'terra-collective',
      teamName: 'Terra Collective',
      rank: 4,
      totalScore: 81.2,
      deltaToPrev: -3.5,
      submittedCount: 18,
      criterionScores: [
        { criterionId: 'innovation', label: 'Innovation', averageScore: 8.1, weight: 0.3 },
        { criterionId: 'usability', label: 'User experience', averageScore: 8.4, weight: 0.3 },
        { criterionId: 'technical', label: 'Technical depth', averageScore: 8.0, weight: 0.3 },
        { criterionId: 'story', label: 'Storytelling', averageScore: 8.2, weight: 0.1 },
      ],
    },
  ],
};
