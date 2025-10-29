import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const getSessionMock = vi.fn();

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    getSupabaseClient: vi.fn(() => ({
      auth: {
        getSession: getSessionMock,
      },
    })),
  };
});

import { getSupabaseClient } from '@/lib/api';
import { MagicLinkHandler } from '@/components/auth/MagicLinkHandler';

function LocationEcho() {
  const location = useLocation();
  return (
    <>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="hash">{location.hash}</span>
    </>
  );
}

describe('MagicLinkHandler', () => {
  const getSupabaseClientMock = getSupabaseClient as unknown as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
    getSessionMock.mockResolvedValue({});
    getSupabaseClientMock.mockClear();
  });

  it('consumes Supabase magic link hashes and redirects to the score page', async () => {
    window.location.hash = '#access_token=test-token&type=magiclink&expires_in=3600';

    render(
      <MemoryRouter initialEntries={['/auth#access_token=test-token&type=magiclink']}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <MagicLinkHandler />
                <LocationEcho />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getSupabaseClientMock).toHaveBeenCalledTimes(1);
    });

    expect(getSessionMock).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByTestId('pathname').textContent).toBe('/score');
    });

    expect(window.location.hash).toBe('');
  });

  it('ignores non-magic hashes and leaves navigation untouched', async () => {
    window.location.hash = '#state=123&type=signup';

    render(
      <MemoryRouter initialEntries={['/auth#state=123&type=signup']}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <MagicLinkHandler />
                <LocationEcho />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('pathname').textContent).toBe('/auth');
    });

    expect(getSupabaseClientMock).not.toHaveBeenCalled();
    expect(getSessionMock).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#state=123&type=signup');
  });
});
