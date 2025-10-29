import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  fetchTimerState,
  subscribeToTimerState,
  type FetchTimerStateResult,
  type TimerSubscription,
  TimerApiError,
} from '@/lib/api';
import {
  calculateRemainingMs,
  estimateDrift,
  isDriftBeyondTolerance,
  TIMER_DRIFT_TOLERANCE_MS,
} from '@/lib/timer-utils';
import type { TimerConnectionState, TimerSnapshot } from '@/types/timer';

export interface UseEventTimerOptions {
  eventId: string;
  enabled?: boolean;
  driftToleranceMs?: number;
  tickIntervalMs?: number;
}

interface OptimisticState {
  id: string;
  previous: TimerSnapshot | null;
}

interface InternalTimerState {
  snapshot: TimerSnapshot | null;
  isLoading: boolean;
  error: TimerApiError | null;
  connectionState: TimerConnectionState;
  isOffline: boolean;
  hasRealtime: boolean;
  lastSyncedAt: Date | null;
  remainingMs: number;
  driftMs: number;
  optimisticActionId: string | null;
  optimisticSnapshot: TimerSnapshot | null;
}

export interface UseEventTimerResult extends InternalTimerState {
  isReady: boolean;
  refresh: (reason?: 'manual' | 'initial' | 'drift') => Promise<void>;
  applyOptimisticSnapshot: (actionId: string, snapshot: TimerSnapshot) => void;
  revertOptimisticSnapshot: (actionId: string) => void;
  confirmOptimisticSnapshot: (actionId: string, snapshot?: TimerSnapshot | null) => void;
}

const INITIAL_STATE: InternalTimerState = {
  snapshot: null,
  isLoading: true,
  error: null,
  connectionState: 'idle',
  isOffline: false,
  hasRealtime: false,
  lastSyncedAt: null,
  remainingMs: 0,
  driftMs: 0,
  optimisticActionId: null,
  optimisticSnapshot: null,
};

function ensureDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function useEventTimer({
  eventId,
  enabled = true,
  driftToleranceMs = TIMER_DRIFT_TOLERANCE_MS,
  tickIntervalMs = 250,
}: UseEventTimerOptions): UseEventTimerResult {
  const [state, setState] = useState<InternalTimerState>(INITIAL_STATE);
  const snapshotRef = useRef<TimerSnapshot | null>(null);
  const optimisticRef = useRef<OptimisticState | null>(null);
  const mountedRef = useRef(true);
  const subscriptionRef = useRef<TimerSubscription | null>(null);
  const previousTickRef = useRef<{ timestamp: number; remaining: number }>({
    timestamp: Date.now(),
    remaining: 0,
  });
  const lastDriftSyncRef = useRef(0);

  const applySnapshot = useCallback(
    (snapshot: TimerSnapshot, options?: { isFallback?: boolean; isRealtime?: boolean; error?: TimerApiError | null }) => {
      snapshotRef.current = snapshot;
      optimisticRef.current = null;
      const remaining = calculateRemainingMs(snapshot);
      previousTickRef.current = { timestamp: Date.now(), remaining };

      setState((previous) => ({
        ...previous,
        snapshot,
        isLoading: false,
        error: options?.error ?? null,
        isOffline: options?.isFallback ?? previous.isOffline,
        hasRealtime: options?.isRealtime ? true : previous.hasRealtime,
        lastSyncedAt: ensureDate(snapshot.fetchedAt),
        remainingMs: remaining,
        driftMs: 0,
        optimisticActionId: null,
        optimisticSnapshot: null,
      }));
    },
    [],
  );

  const applyOptimisticSnapshot = useCallback(
    (actionId: string, snapshot: TimerSnapshot) => {
      optimisticRef.current = { id: actionId, previous: snapshotRef.current };
      snapshotRef.current = snapshot;
      const remaining = calculateRemainingMs(snapshot);
      previousTickRef.current = { timestamp: Date.now(), remaining };

      setState((previous) => ({
        ...previous,
        snapshot,
        remainingMs: remaining,
        driftMs: 0,
        optimisticActionId: actionId,
        optimisticSnapshot: snapshot,
      }));
    },
    [],
  );

  const revertOptimisticSnapshot = useCallback((actionId: string) => {
    if (optimisticRef.current?.id !== actionId) {
      return;
    }

    const previousSnapshot = optimisticRef.current.previous;
    optimisticRef.current = null;
    snapshotRef.current = previousSnapshot;
    const remaining = previousSnapshot ? calculateRemainingMs(previousSnapshot) : 0;
    previousTickRef.current = { timestamp: Date.now(), remaining };

    setState((previous) => ({
      ...previous,
      snapshot: previousSnapshot,
      remainingMs: remaining,
      driftMs: 0,
      optimisticActionId: null,
      optimisticSnapshot: null,
    }));
  }, []);

  const confirmOptimisticSnapshot = useCallback(
    (actionId: string, resolvedSnapshot?: TimerSnapshot | null) => {
      if (optimisticRef.current?.id !== actionId) {
        if (resolvedSnapshot) {
          applySnapshot(resolvedSnapshot, { isRealtime: true });
        }
        return;
      }

      optimisticRef.current = null;

      if (resolvedSnapshot) {
        applySnapshot(resolvedSnapshot, { isRealtime: true });
        return;
      }

      setState((previous) => ({
        ...previous,
        optimisticActionId: null,
        optimisticSnapshot: null,
      }));
    },
    [applySnapshot],
  );

  const refresh = useCallback(
    async (reason: 'manual' | 'initial' | 'drift' = 'manual') => {
      if (!enabled || !eventId) {
        setState((previous) => ({ ...previous, isLoading: false }));
        return;
      }

      setState((previous) => ({
        ...previous,
        isLoading: reason === 'initial' || previous.snapshot === null,
        error: null,
      }));

      try {
        const result: FetchTimerStateResult = await fetchTimerState({ eventId });
        if (!mountedRef.current) {
          return;
        }

        applySnapshot(result.snapshot, { isFallback: result.isFallback, error: result.error ?? null });
      } catch (error) {
        if (!mountedRef.current) {
          return;
        }

        const timerError =
          error instanceof TimerApiError
            ? error
            : new TimerApiError('Unable to synchronise the timer state.', error);

        setState((previous) => ({
          ...previous,
          isLoading: false,
          error: timerError,
        }));
      }
    },
    [applySnapshot, enabled, eventId],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !eventId) {
      setState((previous) => ({ ...previous, isLoading: false }));
      return;
    }

    void refresh('initial');
  }, [enabled, eventId, refresh]);

  useEffect(() => {
    if (!enabled || !eventId) {
      return;
    }

    setState((previous) => ({ ...previous, connectionState: 'connecting' }));

    void subscribeToTimerState({
      eventId,
      onUpdate: (snapshot) => {
        if (!mountedRef.current) {
          return;
        }

        applySnapshot({ ...snapshot, fetchedAt: new Date().toISOString(), source: 'network' });
      },
      onStatusChange: (status) => {
        if (!mountedRef.current) {
          return;
        }

        setState((previous) => ({
          ...previous,
          connectionState: status,
          hasRealtime: status === 'open' ? true : previous.hasRealtime,
        }));
      },
      onError: (error) => {
        if (!mountedRef.current) {
          return;
        }

        setState((previous) => ({
          ...previous,
          error,
        }));
      },
    }).then((subscription) => {
      subscriptionRef.current = subscription;
    });

    return () => {
      const subscription = subscriptionRef.current;
      subscriptionRef.current = null;
      if (subscription) {
        void subscription.unsubscribe();
      }
    };
  }, [applySnapshot, enabled, eventId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = window.setInterval(() => {
      const snapshot = snapshotRef.current;
      if (!snapshot) {
        return;
      }

      const now = Date.now();
      const remaining = calculateRemainingMs(snapshot, now);
      const drift = estimateDrift(previousTickRef.current.remaining, previousTickRef.current.timestamp, remaining, now);
      previousTickRef.current = { timestamp: now, remaining };

      setState((previous) => ({
        ...previous,
        remainingMs: remaining,
        driftMs: drift,
      }));

      if (isDriftBeyondTolerance(drift, driftToleranceMs) && now - lastDriftSyncRef.current > 5000) {
        lastDriftSyncRef.current = now;
        void refresh('drift');
      }
    }, Math.max(100, tickIntervalMs));

    return () => {
      window.clearInterval(interval);
    };
  }, [driftToleranceMs, enabled, refresh, tickIntervalMs]);

  const derived = useMemo(
    () => ({
      ...state,
      isReady: Boolean(state.snapshot),
    }),
    [state],
  );

  return {
    ...derived,
    refresh,
    applyOptimisticSnapshot,
    revertOptimisticSnapshot,
    confirmOptimisticSnapshot,
  } satisfies UseEventTimerResult;
}
