import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export class AuthApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AuthApiError';
  }
}

let client: SupabaseClient | undefined;

export function setSupabaseClient(instance: SupabaseClient | undefined) {
  client = instance;
}

export function resetSupabaseClient() {
  client = undefined;
}

export function getSupabaseClient(): SupabaseClient {
  if (client) {
    return client;
  }

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new AuthApiError('Supabase credentials are not configured.');
  }

  client = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

  return client;
}

export interface RequestMagicLinkOptions {
  email: string;
  eventId?: string;
  redirectTo?: string;
}

export async function requestMagicLink({
  email,
  eventId,
  redirectTo,
}: RequestMagicLinkOptions): Promise<void> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    throw new AuthApiError('An email address is required to request a magic link.');
  }

  const supabase = getSupabaseClient();
  const defaultRedirect =
    redirectTo ?? (typeof window !== 'undefined' ? `${window.location.origin}/score` : undefined);

  const { error } = await supabase.auth.signInWithOtp({
    email: trimmedEmail,
    options: {
      data: eventId ? { event_id: eventId } : undefined,
      emailRedirectTo: defaultRedirect,
    },
  });

  if (error) {
    throw new AuthApiError('We were unable to send a magic link. Please try again.', error);
  }
}

export interface VerifyPinOptions {
  email: string;
  pin: string;
}

export interface VerifyPinResult {
  success: boolean;
  message?: string;
  sessionToken?: string;
}

export async function verifyPin({ email, pin }: VerifyPinOptions): Promise<VerifyPinResult> {
  const trimmedEmail = email.trim().toLowerCase();
  const sanitizedPin = pin.replace(/\D/g, '').slice(0, 6);

  if (!trimmedEmail || sanitizedPin.length !== 6) {
    throw new AuthApiError('A 6-digit PIN and email address are required to continue.');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('verify-pin', {
    body: {
      email: trimmedEmail,
      pin: sanitizedPin,
    },
  });

  if (error) {
    throw new AuthApiError('We could not verify the PIN. Please try again.', error);
  }

  return {
    success: true,
    ...(data as Record<string, unknown>),
  } as VerifyPinResult;
}

export async function getSession() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new AuthApiError('Unable to retrieve the current session.', error);
  }

  return data.session;
}

export async function refreshSession() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    throw new AuthApiError('Unable to refresh the current session.', error);
  }

  return data.session;
}

export interface LogAuthEventPayload {
  type: 'magic_link_requested' | 'pin_verified' | 'logout' | 'session_refreshed' | 'error';
  detail?: string;
  email?: string;
}

export async function logAuthEvent(payload: LogAuthEventPayload) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('auth_event_logs').insert({
    ...payload,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new AuthApiError('Failed to record the authentication event.', error);
  }
}
