export interface OfflineBriefSnapshot {
  title: string;
  summary: string;
  tips: Array<{ id: string; label: string; description: string }>;
  updatedAt: string;
}

export const offlineBriefSnapshot: OfflineBriefSnapshot = {
  title: 'Offline judging essentials',
  summary:
    'You are viewing a cached briefing. Connect to the network for the latest prompts, mentor contacts, and submission updates.',
  tips: [
    {
      id: 'criteria',
      label: 'Scoring criteria',
      description: 'Innovation, usability, and technical depth each carry 30% weight; storytelling covers the final 10%.',
    },
    {
      id: 'timekeeping',
      label: 'Timekeeping',
      description: 'Aim to conclude each pitch review within 7 minutes to remain on schedule.',
    },
    {
      id: 'support',
      label: 'Support contacts',
      description: 'Ping the operations desk in Slack channel #help-judges for emergencies.',
    },
  ],
  updatedAt: '2024-02-01T00:00:00.000Z',
};
