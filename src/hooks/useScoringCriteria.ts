import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fallbackScoringCriteria } from '@/config/scoring';
import { getScoringCriteria, ScoringApiError } from '@/lib/api';
import type { ScoringCriteriaSnapshot, ScoringCriterion } from '@/types/scoring';

const CACHE_NAMESPACE = 'hackathonjudgeapp.scoringCriteria.v1';

interface UseScoringCriteriaState {
  criteria: ScoringCriterion[];
  isLoading: boolean;
  error: Error | null;
  isOffline: boolean;
  source: ScoringCriteriaSnapshot['source'] | null;
  lastUpdated: Date | null;
  hasCachedSnapshot: boolean;
}

function getCacheKey(eventId: string) {
  return `${CACHE_NAMESPACE}:${eventId}`;
}

function readCache(eventId: string): ScoringCriteriaSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getCacheKey(eventId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as ScoringCriteriaSnapshot;

    return {
      ...parsed,
      criteria: parsed.criteria.map((criterion) => ({ ...criterion })),
    };
  } catch (error) {
    console.warn('Failed to read cached scoring criteria', error);
    return null;
  }
}

function writeCache(snapshot: ScoringCriteriaSnapshot) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(getCacheKey(snapshot.eventId), JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Failed to cache scoring criteria', error);
  }
}

export interface UseScoringCriteriaOptions {
  eventId: string;
  enableCache?: boolean;
}

export function useScoringCriteria({ eventId, enableCache = true }: UseScoringCriteriaOptions) {
  const [state, setState] = useState<UseScoringCriteriaState>(() => ({
    criteria: [],
    isLoading: true,
    error: null,
    isOffline: false,
    source: null,
    lastUpdated: null,
    hasCachedSnapshot: false,
  }));

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadCriteria = useCallback(async () => {
    if (!eventId) {
      setState((previous) => ({
        ...previous,
        isLoading: false,
        error: new ScoringApiError('An event identifier is required to load scoring criteria.'),
      }));
      return;
    }

    const cachedSnapshot = enableCache ? readCache(eventId) : null;

    if (cachedSnapshot && mountedRef.current) {
      setState({
        criteria: cachedSnapshot.criteria,
        isLoading: true,
        error: null,
        isOffline: false,
        source: cachedSnapshot.source,
        lastUpdated: new Date(cachedSnapshot.fetchedAt),
        hasCachedSnapshot: true,
      });
    } else {
      setState((previous) => ({
        ...previous,
        isLoading: true,
        error: null,
        source: previous.source,
      }));
    }

    try {
      const criteria = await getScoringCriteria(eventId);
      const snapshot: ScoringCriteriaSnapshot = {
        eventId,
        criteria,
        fetchedAt: new Date().toISOString(),
        source: 'network',
      };

      if (enableCache) {
        writeCache(snapshot);
      }

      if (!mountedRef.current) {
        return;
      }

      setState({
        criteria: snapshot.criteria,
        isLoading: false,
        error: null,
        isOffline: false,
        source: snapshot.source,
        lastUpdated: new Date(snapshot.fetchedAt),
        hasCachedSnapshot: true,
      });
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      if (cachedSnapshot) {
        setState({
          criteria: cachedSnapshot.criteria,
          isLoading: false,
          error: null,
          isOffline: true,
          source: cachedSnapshot.source,
          lastUpdated: new Date(cachedSnapshot.fetchedAt),
          hasCachedSnapshot: true,
        });
        return;
      }

      const fallbackSnapshot: ScoringCriteriaSnapshot = {
        eventId,
        criteria: fallbackScoringCriteria.map((criterion) => ({ ...criterion })),
        fetchedAt: new Date().toISOString(),
        source: 'fallback',
      };

      setState({
        criteria: fallbackSnapshot.criteria,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unable to load scoring criteria'),
        isOffline: true,
        source: fallbackSnapshot.source,
        lastUpdated: new Date(fallbackSnapshot.fetchedAt),
        hasCachedSnapshot: false,
      });
    }
  }, [enableCache, eventId]);

  useEffect(() => {
    loadCriteria();
  }, [loadCriteria]);

  const value = useMemo(
    () => ({
      ...state,
      refetch: loadCriteria,
    }),
    [loadCriteria, state],
  );

  return value;
}
