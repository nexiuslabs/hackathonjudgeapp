import { createFallbackTimerSnapshot } from '@/config/timer-fallback';
import type { TimerControlAction, TimerSnapshot, TimerState } from '@/types/timer';

export const DEFAULT_TIMER_DURATION_SECONDS = 420;
export const TIMER_DRIFT_TOLERANCE_MS = 400;

function ensureTimerSnapshot(timer: TimerSnapshot | TimerState | null, eventId: string): TimerSnapshot {
  if (!timer) {
    return createFallbackTimerSnapshot({ eventId, durationSeconds: DEFAULT_TIMER_DURATION_SECONDS });
  }

  return {
    ...(timer as TimerSnapshot),
    fetchedAt: 'fetchedAt' in timer ? timer.fetchedAt : new Date().toISOString(),
    source: 'source' in timer ? timer.source : 'network',
  };
}

export function toIsoString(value: number): string {
  return new Date(value).toISOString();
}

export function calculateElapsedMs(timer: TimerSnapshot | TimerState, now = Date.now()): number {
  const durationMs = (timer.durationSeconds ?? 0) * 1000;

  if (!timer.startedAt) {
    return timer.phase === 'completed' ? durationMs : 0;
  }

  const startedAt = new Date(timer.startedAt).getTime();
  if (Number.isNaN(startedAt)) {
    return 0;
  }

  if (timer.phase === 'running') {
    return Math.max(0, now - startedAt);
  }

  const pausedAt = timer.pausedAt ? new Date(timer.pausedAt).getTime() : now;
  if (Number.isNaN(pausedAt)) {
    return 0;
  }

  return Math.max(0, pausedAt - startedAt);
}

export function calculateRemainingMs(timer: TimerSnapshot | TimerState, now = Date.now()): number {
  const elapsed = calculateElapsedMs(timer, now);
  const total = Math.max(0, (timer.durationSeconds ?? 0) * 1000);
  return Math.max(0, total - elapsed);
}

export function getCountdownParts(remainingMs: number) {
  const clamped = Math.max(0, remainingMs);
  const minutes = Math.floor(clamped / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);
  const milliseconds = Math.floor((clamped % 1000) / 10);

  return {
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    hundredths: milliseconds.toString().padStart(2, '0'),
  };
}

export function formatCountdownLabel(remainingMs: number): string {
  const { minutes, seconds } = getCountdownParts(remainingMs);
  return `${minutes}:${seconds}`;
}

export interface DeriveOptimisticTimerSnapshotOptions {
  current: TimerSnapshot | null;
  action: TimerControlAction;
  eventId?: string;
  durationSeconds?: number | null;
  now?: number;
  controlOwner?: string | null;
}

export function deriveOptimisticTimerSnapshot({
  current,
  action,
  eventId,
  durationSeconds,
  now = Date.now(),
  controlOwner,
}: DeriveOptimisticTimerSnapshotOptions): TimerSnapshot {
  const base = ensureTimerSnapshot(current, eventId ?? current?.eventId ?? 'unknown-event');
  const isoNow = toIsoString(now);
  const duration = Math.max(
    0,
    durationSeconds ?? base.durationSeconds ?? DEFAULT_TIMER_DURATION_SECONDS,
  );
  const remainingBefore = calculateRemainingMs(base, now);

  switch (action) {
    case 'start':
      return {
        ...base,
        phase: 'running',
        durationSeconds: duration,
        startedAt: isoNow,
        pausedAt: null,
        controlOwner: controlOwner ?? base.controlOwner,
        updatedAt: isoNow,
        fetchedAt: isoNow,
        revision: base.revision + 1,
        source: 'optimistic',
      };
    case 'pause':
      return {
        ...base,
        phase: 'paused',
        pausedAt: isoNow,
        controlOwner: controlOwner ?? base.controlOwner,
        updatedAt: isoNow,
        fetchedAt: isoNow,
        revision: base.revision + 1,
        source: 'optimistic',
      };
    case 'resume': {
      const elapsed = Math.min(duration * 1000, duration * 1000 - remainingBefore);
      const resumedStart = toIsoString(now - elapsed);
      return {
        ...base,
        phase: 'running',
        pausedAt: null,
        startedAt: resumedStart,
        controlOwner: controlOwner ?? base.controlOwner,
        updatedAt: isoNow,
        fetchedAt: isoNow,
        revision: base.revision + 1,
        source: 'optimistic',
      };
    }
    case 'reset':
      return {
        ...base,
        phase: 'idle',
        durationSeconds: duration,
        startedAt: null,
        pausedAt: null,
        controlOwner: controlOwner ?? base.controlOwner,
        updatedAt: isoNow,
        fetchedAt: isoNow,
        revision: base.revision + 1,
        source: 'optimistic',
      };
    case 'apply_preset':
    default:
      return {
        ...base,
        durationSeconds: duration,
        updatedAt: isoNow,
        fetchedAt: isoNow,
        controlOwner: controlOwner ?? base.controlOwner,
        revision: base.revision + 1,
        source: 'optimistic',
      };
  }
}

export function estimateDrift(previousRemainingMs: number, previousTimestamp: number, nextRemainingMs: number, now = Date.now()) {
  const expected = Math.max(0, previousRemainingMs - (now - previousTimestamp));
  return nextRemainingMs - expected;
}

export function isDriftBeyondTolerance(driftMs: number, tolerance = TIMER_DRIFT_TOLERANCE_MS) {
  return Math.abs(driftMs) > tolerance;
}
