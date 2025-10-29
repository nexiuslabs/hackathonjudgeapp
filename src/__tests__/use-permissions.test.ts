import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    getSession: getSessionMock,
  };
});

describe('usePermissions', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('returns fallback admin permissions when Supabase is not configured', async () => {
    const { usePermissions } = await import('@/hooks/usePermissions');

    const { result } = renderHook(() => usePermissions());

    expect(result.current.role).toBe('admin');
    expect(result.current.canAccessAdmin).toBe(true);
    expect(result.current.source).toBe('fallback');
  });

  it('loads permissions from Supabase when credentials are configured', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');

    const { AuthApiError } = await import('@/lib/api');

    getSessionMock.mockResolvedValue({
      user: {
        email: 'ops@example.com',
        user_metadata: {
          role: 'operations',
          event_id: 'event-alpha',
          full_name: 'Operations Lead',
        },
        app_metadata: {},
      },
    });

    const { usePermissions } = await import('@/hooks/usePermissions');
    const { result } = renderHook(() => usePermissions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(result.current.role).toBe('operations');
    expect(result.current.canAccessAdmin).toBe(true);
    expect(result.current.eventId).toBe('event-alpha');
    expect(result.current.source).toBe('supabase');
    expect(result.current.error).toBeNull();

    // Refresh should re-trigger the session lookup.
    getSessionMock.mockRejectedValueOnce(new AuthApiError('Session expired'));
    await result.current.refresh();
    expect(getSessionMock).toHaveBeenCalledTimes(2);
  });
});
