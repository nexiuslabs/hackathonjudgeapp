import type { TimerPreset, TimerSnapshot } from '@/types/timer';

const now = new Date().toISOString();

export const fallbackTimerSnapshot: TimerSnapshot = {
  eventId: 'demo-event',
  phase: 'idle',
  durationSeconds: 420,
  startedAt: null,
  pausedAt: null,
  controlOwner: 'Operations Desk',
  updatedAt: now,
  revision: 1,
  fetchedAt: now,
  source: 'fallback',
};

export const fallbackTimerPresets: TimerPreset[] = [
  {
    id: 'preset-7min',
    eventId: 'demo-event',
    label: 'Pitch · 7:00',
    durationSeconds: 420,
    isDefault: true,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'preset-5min',
    eventId: 'demo-event',
    label: 'Q&A · 5:00',
    durationSeconds: 300,
    isDefault: false,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'preset-2min',
    eventId: 'demo-event',
    label: 'Buffer · 2:00',
    durationSeconds: 120,
    isDefault: false,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  },
];

export function createFallbackTimerSnapshot(
  overrides: Partial<TimerSnapshot> = {},
): TimerSnapshot {
  return {
    ...fallbackTimerSnapshot,
    ...overrides,
    fetchedAt: overrides.fetchedAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}
