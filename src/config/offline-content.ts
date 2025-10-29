export interface OfflineBriefCallout {
  id: string;
  label: string;
  description: string;
}

export interface OfflineBriefCriterion {
  id: string;
  label: string;
  weight: string;
  description: string;
}

export interface OfflineBriefScheduleItem {
  id: string;
  time: string;
  activity: string;
  detail?: string;
}

export interface OfflineBriefFlowStep {
  id: string;
  title: string;
  description: string;
  helper?: string;
}

export interface OfflineBriefRosterEntry {
  id: string;
  name: string;
  role: string;
  expertise: string;
}

export interface OfflineBriefFinalistEntry {
  id: string;
  team: string;
  project: string;
  track: string;
}

export interface OfflineBriefContact {
  id: string;
  label: string;
  detail: string;
  method: 'slack' | 'email' | 'phone';
}

export interface OfflineBriefSnapshot {
  title: string;
  summary: string;
  callouts: OfflineBriefCallout[];
  updatedAt: string;
  cta: {
    label: string;
    description: string;
    href: string;
  };
  schedule: OfflineBriefScheduleItem[];
  criteria: OfflineBriefCriterion[];
  flow: OfflineBriefFlowStep[];
  judges: OfflineBriefRosterEntry[];
  finalists: OfflineBriefFinalistEntry[];
  contacts: OfflineBriefContact[];
}

export const offlineBriefSnapshot: OfflineBriefSnapshot = {
  title: 'Offline judging essentials',
  summary:
    'You are viewing a cached briefing. Connect to the network for the latest prompts, mentor contacts, and submission updates.',
  callouts: [
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
  cta: {
    label: 'Open scoring workspace',
    description: 'Verify you are authenticated before launch; offline mode queues recent submissions automatically.',
    href: '/score',
  },
  schedule: [
    {
      id: 'welcome',
      time: '08:30',
      activity: 'Judge arrival & breakfast briefing',
      detail: 'Pick up badges near the Crescent Ballroom. Ops team will review scoring rubric updates.',
    },
    {
      id: 'round-one',
      time: '09:00',
      activity: 'Round 1 pitches begin',
      detail: 'Each team has 7 minutes to present and 3 minutes for Q&A. Transition immediately to scoring afterwards.',
    },
    {
      id: 'deliberation',
      time: '12:30',
      activity: 'Deliberation huddle',
      detail: 'Meet in the Horizon Room to finalize top finalists. Bring your tablets to cross-check scores.',
    },
    {
      id: 'showcase',
      time: '15:30',
      activity: 'Showcase & awards',
      detail: 'Finalists demo on the main stage. Judges present awards immediately afterwards.',
    },
  ],
  criteria: [
    {
      id: 'innovation',
      label: 'Innovation',
      weight: '30%',
      description: 'Novelty of the approach and differentiation from existing solutions.',
    },
    {
      id: 'usability',
      label: 'User experience',
      weight: '30%',
      description: 'Clarity of problem framing, interface quality, and accessibility considerations.',
    },
    {
      id: 'technical',
      label: 'Technical depth',
      weight: '30%',
      description: 'Robustness of the architecture, data strategy, and scalability of the solution.',
    },
    {
      id: 'story',
      label: 'Storytelling',
      weight: '10%',
      description: 'Ability to connect solution impact to judging rubric with compelling narrative.',
    },
  ],
  flow: [
    {
      id: 'prep',
      title: 'Pre-pitch prep',
      description: 'Review the rubric and queue today’s teams in the scoring workspace before the first session.',
      helper: 'Offline cache stores the latest roster; refresh once connected for changes.',
    },
    {
      id: 'observe',
      title: 'Pitch observation',
      description: 'Capture qualitative notes in the scoring flow while teams present. Flag blockers for follow-up.',
    },
    {
      id: 'deliberate',
      title: 'Deliberation sync',
      description: 'Compare weighted scores and align on top finalists. Use manual refresh to pull updated tie-break guidance.',
    },
    {
      id: 'announce',
      title: 'Awards & closeout',
      description: 'Confirm winners in the admin console and ensure final tallies sync with main display before announcement.',
    },
  ],
  judges: [
    {
      id: 'avery-kim',
      name: 'Avery Kim',
      role: 'Head Judge',
      expertise: 'AI ethics & robotics product strategy',
    },
    {
      id: 'maria-chen',
      name: 'Maria Chen',
      role: 'Partner Judge',
      expertise: 'Healthcare platforms & regulatory compliance',
    },
    {
      id: 'luis-ramos',
      name: 'Luis Ramos',
      role: 'Guest Judge',
      expertise: 'Fintech infrastructure & risk',
    },
    {
      id: 'imani-patel',
      name: 'Imani Patel',
      role: 'Community Judge',
      expertise: 'Civic tech & accessibility advocacy',
    },
  ],
  finalists: [
    {
      id: 'aurora',
      team: 'Team Aurora',
      project: 'Solaris Grid Optimizer',
      track: 'Sustainability',
    },
    {
      id: 'atlas',
      team: 'Atlas Labs',
      project: 'Relay Health Companion',
      track: 'Healthcare',
    },
    {
      id: 'neon',
      team: 'Neon Harbor',
      project: 'HarborGuard Analytics',
      track: 'Maritime Safety',
    },
    {
      id: 'zenith',
      team: 'Zenith Collective',
      project: 'Pulse Civic Dashboard',
      track: 'Civic Innovation',
    },
  ],
  contacts: [
    {
      id: 'operations',
      label: 'Operations desk',
      detail: '#help-judges on Slack (pinned resources & live support)',
      method: 'slack',
    },
    {
      id: 'program',
      label: 'Program lead',
      detail: 'lauren@nexiuslabs.com — escalation for schedule or scoring issues',
      method: 'email',
    },
    {
      id: 'venue',
      label: 'Venue hotline',
      detail: '(555) 013-7788 — A/V & facilities emergencies',
      method: 'phone',
    },
  ],
};
