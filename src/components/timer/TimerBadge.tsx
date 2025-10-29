import { WifiOff } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { useMemo } from 'react';

import { getCountdownParts } from '@/lib/timer-utils';
import { cn } from '@/lib/utils';
import type { TimerConnectionState, TimerPhase } from '@/types/timer';

const phaseLabels: Record<TimerPhase, string> = {
  idle: 'Ready',
  running: 'Live',
  paused: 'Paused',
  completed: 'Complete',
};

interface TimerBadgeProps extends ComponentPropsWithoutRef<'button'> {
  remainingMs: number;
  phase: TimerPhase;
  connectionState: TimerConnectionState;
  isOffline: boolean;
  driftMs: number;
  lastSyncedAt?: Date | null;
  controlOwner?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

function getStatusTone(phase: TimerPhase): string {
  switch (phase) {
    case 'running':
      return 'bg-emerald-500/15 text-emerald-100 border-emerald-500/40';
    case 'paused':
      return 'bg-amber-500/15 text-amber-100 border-amber-500/40';
    case 'completed':
      return 'bg-sky-500/15 text-sky-100 border-sky-500/40';
    default:
      return 'bg-brand-500/15 text-brand-100 border-brand-500/40';
  }
}

export function TimerBadge({
  remainingMs,
  phase,
  connectionState,
  isOffline,
  driftMs,
  lastSyncedAt,
  controlOwner,
  size = 'md',
  className,
  ...props
}: TimerBadgeProps) {
  const { minutes, seconds } = useMemo(() => getCountdownParts(remainingMs), [remainingMs]);
  const label = phaseLabels[phase] ?? 'Timer';
  const isConnectionIssue = connectionState === 'error' || connectionState === 'closed';
  const driftWarning = Math.abs(driftMs) > 500;

  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'lg':
        return {
          container: 'px-5 py-3 text-lg',
          digits: 'text-2xl font-semibold tabular-nums tracking-tight',
        };
      case 'sm':
        return {
          container: 'px-3 py-1.5 text-xs',
          digits: 'text-base font-semibold tabular-nums',
        };
      default:
        return {
          container: 'px-4 py-2 text-sm',
          digits: 'text-xl font-semibold tabular-nums',
        };
    }
  }, [size]);

  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex items-center gap-3 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70',
        getStatusTone(phase),
        sizeClasses.container,
        props.disabled && 'cursor-not-allowed opacity-70',
        className,
      )}
      aria-live="polite"
    >
      <span className={cn('flex items-baseline gap-1 font-mono', sizeClasses.digits)}>
        <span aria-hidden="true">{minutes}</span>
        <span aria-hidden="true">:</span>
        <span aria-hidden="true">{seconds}</span>
        <span className="sr-only">{label} timer at {minutes} minutes {seconds} seconds</span>
      </span>
      <span className="flex flex-col items-start text-left">
        <span className="text-[0.7rem] uppercase tracking-[0.28em] text-white/60">{label}</span>
        <span className="text-xs font-medium text-white/80">
          {isOffline ? 'Offline fallback' : controlOwner ? `Lead: ${controlOwner}` : 'Live sync'}
        </span>
        {lastSyncedAt ? (
          <span className="text-[0.65rem] text-white/50">Synced {lastSyncedAt.toLocaleTimeString()}</span>
        ) : null}
      </span>
      {isConnectionIssue ? (
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-white/10"
          role="status"
          aria-label="Connection issue"
        >
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      ) : driftWarning ? (
        <span className="text-[0.65rem] font-medium text-amber-200">Drift {Math.round(driftMs)}ms</span>
      ) : null}
    </button>
  );
}
