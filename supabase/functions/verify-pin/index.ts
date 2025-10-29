// Supabase Edge Function: verify-pin
// Validates a 6-digit PIN against stored judge profile hashes with rate limiting.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

type JudgeProfile = {
  id: string;
  event_id: string | null;
  pin_hash: string;
  pin_salt: string;
  pin_valid_until: string | null;
  requires_reset: boolean;
  failed_attempts: number | null;
};

type PinAttemptInsert = {
  email: string;
  event_id?: string | null;
  success: boolean;
  message: string;
  ip_address?: string | null;
  user_agent?: string | null;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials for verify-pin function.');
}

const RATE_LIMIT_MAX_ATTEMPTS = parseInt(Deno.env.get('PIN_RATE_LIMIT_MAX_ATTEMPTS') ?? '5', 10);
const RATE_LIMIT_WINDOW_MINUTES = parseInt(Deno.env.get('PIN_RATE_LIMIT_WINDOW_MINUTES') ?? '15', 10);
const PIN_LENGTH = parseInt(Deno.env.get('PIN_LENGTH') ?? '6', 10);

const supabase = createClient(supabaseUrl ?? '', serviceRoleKey ?? '', {
  auth: {
    persistSession: false,
  },
});

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders,
  });
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${pin}:${salt}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function recordAttempt(attempt: PinAttemptInsert) {
  const { error } = await supabase.from('pin_verification_attempts').insert({
    email: attempt.email,
    event_id: attempt.event_id ?? null,
    success: attempt.success,
    message: attempt.message,
    ip_address: attempt.ip_address ?? null,
    user_agent: attempt.user_agent ?? null,
  });

  if (error) {
    console.error('Failed to record PIN attempt', error.message);
  }
}

async function logAuthEvent(payload: { type: string; detail?: string; email?: string }) {
  const { error } = await supabase.from('auth_event_logs').insert({
    type: payload.type,
    detail: payload.detail ?? null,
    email: payload.email ?? null,
  });

  if (error) {
    console.error('Failed to log auth event', error.message);
  }
}

async function checkRateLimit(email: string) {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('pin_verification_attempts')
    .select('id, success')
    .eq('email', email)
    .gte('attempted_at', windowStart)
    .order('attempted_at', { ascending: false });

  if (error) {
    console.error('Failed to read rate limit window', error.message);
    return { limited: false, attempts: 0 };
  }

  const failures = (data ?? []).filter((row) => row.success === false).length;
  return { limited: failures >= RATE_LIMIT_MAX_ATTEMPTS, attempts: failures };
}

function getRequestContext(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for') ??
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    null;
  const userAgent = request.headers.get('user-agent') ?? null;

  return { ip, userAgent };
}

async function getJudgeProfile(email: string): Promise<JudgeProfile | null> {
  const { data, error } = await supabase
    .from('judge_profiles')
    .select('id, event_id, pin_hash, pin_salt, pin_valid_until, requires_reset, failed_attempts')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch judge profile', error.message);
    return null;
  }

  return data ?? null;
}

async function updateFailureState(profile: JudgeProfile | null) {
  if (!profile) return;

  const attemptedCount = (profile.failed_attempts ?? 0) + 1;
  const { error } = await supabase
    .from('judge_profiles')
    .update({
      failed_attempts: attemptedCount,
      last_attempt_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  if (error) {
    console.error('Failed to update judge profile after failed attempt', error.message);
  }
  profile.failed_attempts = attemptedCount;
}

async function resetFailureState(profile: JudgeProfile) {
  const { error } = await supabase
    .from('judge_profiles')
    .update({
      failed_attempts: 0,
      last_attempt_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  if (error) {
    console.error('Failed to reset judge profile failure state', error.message);
  }
  profile.failed_attempts = 0;
}

Deno.serve(async (request: Request) => {
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { success: false, message: 'Supabase credentials not configured.' });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { success: false, message: 'Method not allowed' });
  }

  try {
    const { email, pin } = await request.json();
    const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const sanitizedPin = typeof pin === 'string' ? pin.replace(/\D/g, '') : '';

    if (!sanitizedEmail || sanitizedPin.length !== PIN_LENGTH) {
      return jsonResponse(400, { success: false, message: 'Email and valid PIN are required.' });
    }

    const context = getRequestContext(request);
    const rateLimit = await checkRateLimit(sanitizedEmail);
    if (rateLimit.limited) {
      await recordAttempt({
        email: sanitizedEmail,
        success: false,
        message: 'Rate limited',
        ip_address: context.ip,
        user_agent: context.userAgent,
      });

      await logAuthEvent({
        type: 'error',
        email: sanitizedEmail,
        detail: 'PIN verification rate limited',
      });

      return jsonResponse(429, {
        success: false,
        message: 'Too many attempts. Please try again later or contact an organizer.',
      });
    }

    const profile = await getJudgeProfile(sanitizedEmail);

    if (!profile) {
      await recordAttempt({
        email: sanitizedEmail,
        success: false,
        message: 'Profile not found',
        ip_address: context.ip,
        user_agent: context.userAgent,
      });

      await logAuthEvent({
        type: 'error',
        email: sanitizedEmail,
        detail: 'PIN verification failed: profile not found',
      });

      return jsonResponse(401, { success: false, message: 'Invalid PIN or email.' });
    }

    if (profile.requires_reset) {
      await recordAttempt({
        email: sanitizedEmail,
        event_id: profile.event_id ?? undefined,
        success: false,
        message: 'PIN requires reset',
        ip_address: context.ip,
        user_agent: context.userAgent,
      });

      return jsonResponse(423, {
        success: false,
        message: 'Your PIN has been reset by the organizers. Request a new code.',
      });
    }

    if (profile.pin_valid_until) {
      const expiration = new Date(profile.pin_valid_until);
      if (Number.isNaN(expiration.getTime()) || expiration.getTime() < Date.now()) {
        await recordAttempt({
          email: sanitizedEmail,
          event_id: profile.event_id ?? undefined,
          success: false,
          message: 'PIN expired',
          ip_address: context.ip,
          user_agent: context.userAgent,
        });

        return jsonResponse(410, {
          success: false,
          message: 'This PIN has expired. Request a new one from the organizers.',
        });
      }
    }

    const computedHash = await hashPin(sanitizedPin, profile.pin_salt);
    if (computedHash !== profile.pin_hash) {
      await updateFailureState(profile);
      await recordAttempt({
        email: sanitizedEmail,
        event_id: profile.event_id ?? undefined,
        success: false,
        message: 'Invalid PIN',
        ip_address: context.ip,
        user_agent: context.userAgent,
      });

      await logAuthEvent({
        type: 'error',
        email: sanitizedEmail,
        detail: 'PIN verification failed: invalid PIN',
      });

      return jsonResponse(401, { success: false, message: 'Invalid PIN or email.' });
    }

    await resetFailureState(profile);

    const sessionToken = crypto.randomUUID();

    await recordAttempt({
      email: sanitizedEmail,
      event_id: profile.event_id ?? undefined,
      success: true,
      message: 'PIN verified',
      ip_address: context.ip,
      user_agent: context.userAgent,
    });

    await logAuthEvent({
      type: 'pin_verified',
      email: sanitizedEmail,
      detail: 'PIN verified via edge function',
    });

    return jsonResponse(200, {
      success: true,
      message: 'PIN verified successfully.',
      sessionToken,
    });
  } catch (error) {
    console.error('Unexpected error verifying PIN', error);
    return jsonResponse(500, { success: false, message: 'Unexpected error verifying PIN.' });
  }
});
