import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCommentFields } from '@/hooks/useCommentFields';

const STORAGE_KEY = 'hackathonjudgeapp.commentDraft:event:team';

describe('useCommentFields', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it('trims payload values while preserving the textarea display', async () => {
    const { result } = renderHook(() => useCommentFields({ storageKey: 'event:team', debounceMs: 200 }));

    act(() => {
      result.current.strength.onChange('  Hello world   ');
    });

    expect(result.current.strength.value).toBe('  Hello world   ');
    expect(result.current.getPayload().strength).toBe('Hello world');

    await act(async () => {
      vi.advanceTimersByTime(220);
    });

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored ?? '{}');
    expect(parsed.strength).toBe('Hello world');
  });

  it('flushes drafts immediately when requested', async () => {
    const { result } = renderHook(() => useCommentFields({ storageKey: 'event:team', debounceMs: 400 }));

    act(() => {
      result.current.improvement.onChange('Needs a clearer hook.');
    });

    let saved: boolean | undefined;
    await act(async () => {
      saved = await result.current.flush();
    });

    expect(saved).toBe(true);

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored ?? '{}');
    expect(parsed.improvement).toBe('Needs a clearer hook.');
  });

  it('caps comment values at the configured maximum length', () => {
    const { result } = renderHook(() => useCommentFields({ storageKey: 'event:team', maxLength: 10 }));

    act(() => {
      result.current.strength.onChange('This feedback is longer than allowed.');
    });

    expect(result.current.strength.value.length).toBe(10);
  });
});
