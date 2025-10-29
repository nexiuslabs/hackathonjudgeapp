import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { DEFAULT_MAX_SCORE, DEFAULT_MIN_SCORE, fallbackScoringCriteria } from '@/config/scoring';
import type { ScoringCriterion } from '@/types/scoring';

export class AuthApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AuthApiError';
  }
}

export class ScoringApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ScoringApiError';
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

export interface SupabaseScoringCriterionRow {
  event_id: string;
  criterion_id: string;
  label: string;
  helper_copy?: string | null;
  weight?: number | string | null;
  default_value?: number | null;
  order_index?: number | null;
  min_score?: number | null;
  max_score?: number | null;
}

function normaliseWeight(weight: SupabaseScoringCriterionRow['weight']): number {
  if (typeof weight === 'number') {
    return weight > 1 ? weight / 100 : weight;
  }

  if (typeof weight === 'string') {
    const parsed = parseFloat(weight.replace('%', ''));
    if (Number.isFinite(parsed)) {
      return parsed > 1 ? parsed / 100 : parsed;
    }
  }

  return 0;
}

export async function getScoringCriteria(eventId: string): Promise<ScoringCriterion[]> {
  if (!eventId) {
    throw new ScoringApiError('An event identifier is required to load scoring criteria.');
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('scoring_criteria')
      .select('*')
      .eq('event_id', eventId)
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as SupabaseScoringCriterionRow[];

    if (rows.length === 0) {
      return fallbackScoringCriteria.map((criterion) => ({ ...criterion }));
    }

    return rows.map((item, index) => ({
      id: item.criterion_id,
      label: item.label,
      helperText: item.helper_copy ?? '',
      weight: normaliseWeight(item.weight),
      defaultValue: item.default_value ?? null,
      order: item.order_index ?? index,
      minScore: item.min_score ?? DEFAULT_MIN_SCORE,
      maxScore: item.max_score ?? DEFAULT_MAX_SCORE,
    } satisfies ScoringCriterion));
  } catch (error) {
    if (error instanceof ScoringApiError) {
      throw error;
    }

    throw new ScoringApiError('We could not load the scoring criteria. Please try again.', error);
  }
}

export interface CalculateWeightedTotalOptions {
  precision?: number;
  scale?: number;
}

export function calculateWeightedTotal(
  criteria: ScoringCriterion[],
  scores: Record<string, number | undefined>,
  options: CalculateWeightedTotalOptions = {},
): number {
  const { precision = 1, scale = 100 } = options;

  if (!criteria.length) {
    return 0;
  }

  const total = criteria.reduce((sum, criterion) => {
    const rawValue = scores[criterion.id];

    if (typeof rawValue !== 'number' || Number.isNaN(rawValue)) {
      return sum;
    }

    const minScore = criterion.minScore ?? DEFAULT_MIN_SCORE;
    const maxScore = criterion.maxScore ?? DEFAULT_MAX_SCORE;
    const clampedValue = Math.min(Math.max(rawValue, minScore), maxScore);
    const normalised = (clampedValue - minScore) / (maxScore - minScore);

    return sum + normalised * (criterion.weight ?? 0);
  }, 0);

  const scaled = total * scale;
  const factor = 10 ** precision;

  return Math.round(scaled * factor) / factor;
}
