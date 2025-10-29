import type { SupabaseClient } from '@supabase/supabase-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetSupabaseClient, setSupabaseClient } from '@/lib/api';
import { useRankingsFeed } from '@/hooks/useRankingsFeed';

interface SupabaseMockConfig {
  rankingRows?: Array<Record<string, unknown>>;
  rankingError?: { message: string } | null;
  metaRow?: Record<string, unknown> | null;
  metaError?: { message: string; code?: string } | null;
}

function createSupabaseMock({ rankingRows = [], rankingError = null, metaRow = null, metaError = null }: SupabaseMockConfig) {
  const rankingOrder = vi.fn().mockResolvedValue({ data: rankingRows, error: rankingError });
  const rankingEq = vi.fn().mockReturnValue({ order: rankingOrder });
  const rankingSelect = vi.fn().mockReturnValue({ eq: rankingEq });

  const metaMaybeSingle = vi.fn().mockResolvedValue({ data: metaRow, error: metaError });
  const metaEq = vi.fn().mockReturnValue({ maybeSingle: metaMaybeSingle });
  const metaSelect = vi.fn().mockReturnValue({ eq: metaEq });

  const from = vi.fn((table: string) => {
    if (table === 'rankings_view') {
      return { select: rankingSelect };
    }

    if (table === 'rankings_meta') {
      return { select: metaSelect };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  let changeHandler: (() => void) | null = null;
  const on = vi.fn((_, __, callback: () => void) => {
    changeHandler = callback;
    return channel;
  });

  const subscribe = vi.fn((callback?: (status: string) => void) => {
    callback?.('SUBSCRIBED');
    return channel;
  });

  const removeChannel = vi.fn().mockResolvedValue(undefined);

  const channel = {
    on,
    subscribe,
  } as unknown as ReturnType<SupabaseClient['channel']>;

  const supabase = {
    from,
    channel: vi.fn(() => channel),
    removeChannel,
  } as unknown as SupabaseClient;

  return { supabase, from, changeHandler: () => changeHandler, rankingOrder, metaMaybeSingle, removeChannel };
}

describe('useRankingsFeed', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    resetSupabaseClient();
  });

  it('loads rankings from Supabase and exposes metadata', async () => {
    const rankingRows = [
      {
        event_id: 'demo-event',
        team_id: 'team-1',
        team_name: 'Team One',
        total_score: 90.2,
        rank: 1,
        delta_to_prev: null,
        submitted_count: 5,
        criterion_scores: [
          { criterion_id: 'innovation', label: 'Innovation', average_score: 9.5 },
          { criterion_id: 'story', label: 'Story', average_score: 8.4 },
        ],
      },
    ];
    const metaRow = {
      event_id: 'demo-event',
      is_unlocked: true,
      judges_completed: 5,
      total_judges: 5,
      unlocked_at: '2024-02-01T00:00:00.000Z',
    };

    const { supabase } = createSupabaseMock({ rankingRows, metaRow });
    setSupabaseClient(supabase);

    const { result } = renderHook(() => useRankingsFeed({ eventId: 'demo-event', pollInterval: 0 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({ teamId: 'team-1', totalScore: 90.2, rank: 1 });
    expect(result.current.isLocked).toBe(false);
    expect(result.current.judgesCompleted).toBe(5);
    expect(result.current.totalJudges).toBe(5);
    expect(result.current.source).toBe('network');

    const cached = window.localStorage.getItem('hackathonjudgeapp.rankings.v1:demo-event');
    expect(cached).not.toBeNull();
  });

  it('falls back to cached snapshot when the network request fails', async () => {
    const cachedSnapshot = {
      eventId: 'demo-event',
      fetchedAt: new Date().toISOString(),
      entries: [
        {
          teamId: 'team-cached',
          teamName: 'Cached Crew',
          totalScore: 75.5,
          rank: 1,
          deltaToPrev: null,
          submittedCount: 3,
          criterionScores: [],
        },
      ],
      isUnlocked: false,
      unlockMessage: 'Waiting on ops',
      unlockedAt: null,
      unlockEta: null,
      judgesCompleted: 3,
      totalJudges: 6,
      source: 'cache',
    };
    window.localStorage.setItem('hackathonjudgeapp.rankings.v1:demo-event', JSON.stringify(cachedSnapshot));

    const { supabase } = createSupabaseMock({ rankingRows: [], rankingError: { message: 'unavailable' } });
    setSupabaseClient(supabase);

    const { result } = renderHook(() => useRankingsFeed({ eventId: 'demo-event', pollInterval: 0 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.entries[0].teamId).toBe('team-cached');
    expect(result.current.isOffline).toBe(true);
    expect(result.current.isLocked).toBe(true);
    expect(result.current.source).toBe('cache');
  });

  it('refreshes when realtime changes arrive', async () => {
    const rankingRows = [
      {
        event_id: 'demo-event',
        team_id: 'team-1',
        team_name: 'Team One',
        total_score: 90.2,
        rank: 1,
      },
    ];
    const config = createSupabaseMock({ rankingRows });
    let currentRows = rankingRows;
    config.rankingOrder.mockImplementation(() => Promise.resolve({ data: currentRows, error: null }));
    setSupabaseClient(config.supabase);

    const { result } = renderHook(() => useRankingsFeed({ eventId: 'demo-event', pollInterval: 0 }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entries[0].totalScore).toBe(90.2);

    currentRows = [
      {
        event_id: 'demo-event',
        team_id: 'team-1',
        team_name: 'Team One',
        total_score: 95.5,
        rank: 1,
      },
    ];

    await act(async () => {
      config.changeHandler()?.();
      await waitFor(() => expect(result.current.isRefreshing).toBe(false));
    });

    expect(result.current.entries[0].totalScore).toBe(95.5);
    expect(result.current.source).toBe('realtime');
  });
});
