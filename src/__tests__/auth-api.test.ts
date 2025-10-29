import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuthApiError,
  requestMagicLink,
  resetSupabaseClient,
  setSupabaseClient,
  verifyPin,
} from '@/lib/api';

describe('auth api helpers', () => {
  const signInWithOtp = vi.fn();
  const invoke = vi.fn();
  const getSession = vi.fn();
  const refreshSession = vi.fn();
  const insert = vi.fn();
  const from = vi.fn();

  beforeEach(() => {
    signInWithOtp.mockReset();
    invoke.mockReset();
    getSession.mockReset();
    refreshSession.mockReset();
    insert.mockResolvedValue({ error: null });
    from.mockReturnValue({ insert });

    const client = {
      auth: {
        signInWithOtp,
        getSession,
        refreshSession,
      },
      functions: {
        invoke,
      },
      from,
    } as unknown as SupabaseClient;

    setSupabaseClient(client);
  });

  afterEach(() => {
    resetSupabaseClient();
  });

  it('requests a magic link with trimmed, lower-cased email', async () => {
    signInWithOtp.mockResolvedValue({ data: null, error: null });

    await requestMagicLink({ email: '  Judge@Example.COM  ' });

    expect(signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'judge@example.com',
        options: expect.objectContaining({ emailRedirectTo: expect.stringContaining('/score') }),
      }),
    );
  });

  it('throws a friendly error when the magic link request fails', async () => {
    signInWithOtp.mockResolvedValue({ data: null, error: { message: 'rate limited' } });

    await expect(requestMagicLink({ email: 'judge@example.com' })).rejects.toBeInstanceOf(AuthApiError);
  });

  it('verifies a pin via the Supabase edge function', async () => {
    invoke.mockResolvedValue({ data: { success: true, message: 'ok' }, error: null });

    const result = await verifyPin({ email: 'judge@example.com', pin: '12-34-56' });

    expect(invoke).toHaveBeenCalledWith(
      'verify-pin',
      expect.objectContaining({
        body: { email: 'judge@example.com', pin: '123456' },
      }),
    );
    expect(result).toMatchObject({ success: true, message: 'ok' });
  });

  it('surface errors from the verify pin function', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'invalid' } });

    await expect(verifyPin({ email: 'judge@example.com', pin: '000000' })).rejects.toBeInstanceOf(AuthApiError);
  });
});
