import { describe, expect, it } from 'vitest';

import {
  calculateRemainingMs,
  deriveOptimisticTimerSnapshot,
  getCountdownParts,
  isDriftBeyondTolerance,
} from '@/lib/timer-utils';
import type { TimerSnapshot } from '@/types/timer';

describe('timer-utils', () => {
  const baseSnapshot: TimerSnapshot = {
    eventId: 'event-123',
    phase: 'running',
    durationSeconds: 420,
    startedAt: new Date(Date.now() - 60_000).toISOString(),
    pausedAt: null,
    controlOwner: 'Operations Desk',
    updatedAt: new Date().toISOString(),
    revision: 2,
    fetchedAt: new Date().toISOString(),
    source: 'network',
  };

  it('calculates remaining milliseconds for an active timer', () => {
    const remaining = calculateRemainingMs(baseSnapshot, baseSnapshot.startedAt ? new Date(baseSnapshot.startedAt).getTime() + 90_000 : Date.now());
    expect(Math.round(remaining / 1000)).toBeCloseTo(330, 0);
  });

  it('produces countdown parts padded with leading zeros', () => {
    const parts = getCountdownParts(65_430);
    expect(parts).toEqual({ minutes: '01', seconds: '05', hundredths: '43' });
  });

  it('derives optimistic snapshot for start action', () => {
    const optimistic = deriveOptimisticTimerSnapshot({
      current: baseSnapshot,
      action: 'start',
      eventId: baseSnapshot.eventId,
      durationSeconds: 420,
      controlOwner: baseSnapshot.controlOwner,
    });
    expect(optimistic.phase).toBe('running');
    expect(optimistic.startedAt).not.toBe(baseSnapshot.startedAt);
    expect(optimistic.revision).toBe(baseSnapshot.revision + 1);
  });

  it('derives optimistic snapshot for pause action', () => {
    const optimistic = deriveOptimisticTimerSnapshot({
      current: baseSnapshot,
      action: 'pause',
      eventId: baseSnapshot.eventId,
    });
    expect(optimistic.phase).toBe('paused');
    expect(optimistic.pausedAt).not.toBeNull();
  });

  it('detects drift beyond tolerance', () => {
    expect(isDriftBeyondTolerance(800, 400)).toBe(true);
    expect(isDriftBeyondTolerance(200, 400)).toBe(false);
  });
});
