import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fallbackRankingsSnapshot } from '@/config/rankings-fallback';
import {
  fetchRankings,
  RankingsApiError,
  subscribeToRankings,
  type RankingsSubscription,
} from '@/lib/api';
import type {
  RankingEntry,
  RankingsConnectionState,
  RankingsSnapshot,
  RankingsSnapshotSource,
} from '@/types/rankings';

const CACHE_NAMESPACE = 'hackathonjudgeapp.rankings.v1';

function getCacheKey(eventId: string) {
  return `${CACHE_NAMESPACE}:${eventId}`;
}

interface CachedRankingsSnapshot extends RankingsSnapshot {
  fetchedAt: string;
}

function readCache(eventId: string): CachedRankingsSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getCacheKey(eventId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedRankingsSnapshot;
    return {
      ...parsed,
      entries: parsed.entries.map((entry) => ({
        ...entry,
        criterionScores: entry.criterionScores.map((score) => ({ ...score })),
      })),
    };
  } catch (error) {
    console.warn('Failed to read cached rankings snapshot', error);
    return null;
  }
}

function writeCache(snapshot: RankingsSnapshot) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(getCacheKey(snapshot.eventId), JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Failed to cache rankings snapshot', error);
  }
}

export interface UseRankingsFeedOptions {
  eventId: string;
  enabled?: boolean;
  pollInterval?: number;
  staleAfterMs?: number;
  enableCache?: boolean;
}

interface UseRankingsFeedState {
  entries: RankingEntry[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  isOffline: boolean;
  isLocked: boolean;
  source: RankingsSnapshotSource | null;
  lastUpdated: Date | null;
  unlockMessage: string | null;
  unlockedAt: Date | null;
  unlockEta: Date | null;
  judgesCompleted: number | null;
  totalJudges: number | null;
  connectionState: RankingsConnectionState;
  hasRealtime: boolean;
}

export interface UseRankingsFeedResult extends UseRankingsFeedState {
  isStale: boolean;
  refresh: () => Promise<void>;
}

function asDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function useRankingsFeed({
  eventId,
  enabled = true,
  pollInterval = 60_000,
  staleAfterMs = 120_000,
  enableCache = true,
}: UseRankingsFeedOptions): UseRankingsFeedResult {
  const [state, setState] = useState<UseRankingsFeedState>(() => ({
    entries: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
    isOffline: false,
    isLocked: true,
    source: null,
    lastUpdated: null,
    unlockMessage: null,
    unlockedAt: null,
    unlockEta: null,
    judgesCompleted: null,
    totalJudges: null,
    connectionState: 'idle',
    hasRealtime: false,
  }));

  const [now, setNow] = useState(() => Date.now());
  const mountedRef = useRef(true);
  const subscriptionRef = useRef<RankingsSubscription | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, Math.min(Math.max(staleAfterMs / 3, 15_000), staleAfterMs));

    return () => window.clearInterval(interval);
  }, [staleAfterMs]);

  const applySnapshot = useCallback(
    (snapshot: RankingsSnapshot, overrides?: Partial<UseRankingsFeedState>) => {
      if (!mountedRef.current) {
        return;
      }

      setState((previous) => ({
        ...previous,
        ...overrides,
        entries: snapshot.entries,
        isLoading: false,
        isRefreshing: false,
        error: overrides?.error ?? null,
        isOffline: overrides?.isOffline ?? false,
        isLocked: !snapshot.isUnlocked,
        source: overrides?.source ?? snapshot.source,
        lastUpdated: asDate(snapshot.fetchedAt),
        unlockMessage: snapshot.unlockMessage ?? null,
        unlockedAt: asDate(snapshot.unlockedAt ?? null),
        unlockEta: asDate(snapshot.unlockEta ?? null),
        judgesCompleted: snapshot.judgesCompleted ?? null,
        totalJudges: snapshot.totalJudges ?? null,
      }));
    },
    [],
  );

  const loadSnapshot = useCallback(
    async (reason: 'initial' | 'refresh' | 'poll' | 'realtime') => {
      if (!enabled) {
        return;
      }

      if (!eventId) {
        setState((previous) => ({
          ...previous,
          isLoading: false,
          isRefreshing: false,
          error: new RankingsApiError('An event identifier is required to load rankings.'),
        }));
        return;
      }

      if (reason === 'initial') {
        const cached = enableCache ? readCache(eventId) : null;
        if (cached) {
          applySnapshot(cached, { source: cached.source, isOffline: false });
        }
      }

      setState((previous) => ({
        ...previous,
        isLoading: reason === 'initial',
        isRefreshing: reason !== 'initial',
        error: reason === 'initial' ? null : previous.error,
      }));

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const snapshot = await fetchRankings(eventId);

        if (controller.signal.aborted) {
          return;
        }

        if (enableCache) {
          writeCache(snapshot);
        }

        applySnapshot(snapshot, {
          source: reason === 'realtime' ? 'realtime' : snapshot.source,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const cached = enableCache ? readCache(eventId) : null;
        if (cached) {
          applySnapshot(cached, {
            isOffline: true,
            source: cached.source ?? 'cache',
            error: error instanceof Error ? error : new RankingsApiError('Unable to refresh rankings.'),
          });
          return;
        }

        const fallbackSnapshot: RankingsSnapshot = {
          ...fallbackRankingsSnapshot,
          eventId,
          fetchedAt: new Date().toISOString(),
          source: 'fallback',
        };

        applySnapshot(fallbackSnapshot, {
          isOffline: true,
          source: 'fallback',
          error: error instanceof Error ? error : new RankingsApiError('Unable to refresh rankings.'),
        });
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
    [applySnapshot, enableCache, enabled, eventId],
  );

  useEffect(() => {
    loadSnapshot('initial');
  }, [loadSnapshot]);

  useEffect(() => {
    if (!enabled || !eventId) {
      return;
    }

    let isMounted = true;

    subscribeToRankings({
      eventId,
      onChange: () => {
        loadSnapshot('realtime');
      },
      onError: (error) => {
        if (!mountedRef.current) {
          return;
        }
        setState((previous) => ({
          ...previous,
          error,
          connectionState: 'error',
        }));
      },
      onStatusChange: (status) => {
        if (!mountedRef.current) {
          return;
        }
        setState((previous) => ({
          ...previous,
          connectionState: status,
          hasRealtime: status === 'open' || previous.hasRealtime,
        }));
      },
    })
      .then((subscription) => {
        if (!isMounted) {
          subscription?.unsubscribe().catch(() => {
            /* noop */
          });
          return;
        }
        subscriptionRef.current = subscription;
      })
      .catch((error) => {
        const apiError =
          error instanceof RankingsApiError
            ? error
            : new RankingsApiError('Unable to subscribe to rankings updates.', error);
        setState((previous) => ({
          ...previous,
          error: apiError,
          connectionState: 'error',
        }));
      });

    return () => {
      isMounted = false;
      subscriptionRef.current?.unsubscribe().catch(() => {
        /* noop */
      });
      subscriptionRef.current = null;
    };
  }, [enabled, eventId, loadSnapshot]);

  useEffect(() => {
    if (!enabled || !eventId || pollInterval <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      loadSnapshot('poll');
    }, pollInterval);

    return () => window.clearInterval(interval);
  }, [enabled, eventId, loadSnapshot, pollInterval]);

  const refresh = useCallback(async () => {
    await loadSnapshot('refresh');
  }, [loadSnapshot]);

  const isStale = useMemo(() => {
    if (!state.lastUpdated) {
      return false;
    }
    return now - state.lastUpdated.getTime() > staleAfterMs;
  }, [now, staleAfterMs, state.lastUpdated]);

  return useMemo(
    () => ({
      ...state,
      isStale,
      refresh,
    }),
    [isStale, refresh, state],
  );
}
