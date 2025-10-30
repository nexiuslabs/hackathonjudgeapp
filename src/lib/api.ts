import { createClient, REALTIME_SUBSCRIBE_STATES, type SupabaseClient } from '@supabase/supabase-js';

import { DEFAULT_MAX_SCORE, DEFAULT_MIN_SCORE, fallbackScoringCriteria } from '@/config/scoring';
import { createFallbackTimerSnapshot, fallbackTimerPresets } from '@/config/timer-fallback';
import type { RankingEntry, RankingsConnectionState, RankingsSnapshot } from '@/types/rankings';
import type { ScoringCriterion } from '@/types/scoring';
import type { Database } from '@/types/database.types';
import type { AdminEventSnapshot } from '@/types/admin';
import type {
  TimerConnectionState,
  TimerControlAction,
  TimerPhase,
  TimerPreset,
  TimerShareLink,
  TimerSnapshot,
  TimerTokenValidationResult,
} from '@/types/timer';

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

export class RankingsApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'RankingsApiError';
  }
}

export class AdminApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AdminApiError';
  }
}

export class TimerApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'TimerApiError';
  }
}

let client: SupabaseClient<Database> | undefined;

export function setSupabaseClient(instance: SupabaseClient<Database> | undefined) {
  client = instance;
}

export function resetSupabaseClient() {
  client = undefined;
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) {
    return client;
  }

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new AuthApiError('Supabase credentials are not configured.');
  }

  client = createClient<Database>(url, key, {
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

  const appUrl = import.meta.env.VITE_APP_URL;
  const defaultRedirect =
    redirectTo ??
    (appUrl ? `${appUrl}/score` : undefined) ??
    (typeof window !== 'undefined' ? `${window.location.origin}/score` : undefined);

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

export interface SignUpWithPasswordOptions {
  email: string;
  password: string;
  eventId?: string;
  fullName?: string;
}

export interface SignUpWithPasswordResult {
  userId: string;
  email: string;
  needsEmailConfirmation: boolean;
}

export async function signUpWithPassword({
  email,
  password,
  eventId,
  fullName,
}: SignUpWithPasswordOptions): Promise<SignUpWithPasswordResult> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    throw new AuthApiError('An email address is required to sign up.');
  }

  if (!password || password.length < 6) {
    throw new AuthApiError('Password must be at least 6 characters long.');
  }

  const supabase = getSupabaseClient();

  const metadata: Record<string, unknown> = {};
  if (eventId) {
    metadata.event_id = eventId;
  }
  if (fullName) {
    metadata.full_name = fullName;
    metadata.name = fullName;
  }

  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      data: Object.keys(metadata).length > 0 ? metadata : undefined,
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      throw new AuthApiError('This email is already registered. Please sign in instead.', error);
    }
    throw new AuthApiError('Unable to create your account. Please try again.', error);
  }

  if (!data.user) {
    throw new AuthApiError('Account creation failed. Please try again.');
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? trimmedEmail,
    needsEmailConfirmation: !data.session,
  };
}

export interface SignInWithPasswordOptions {
  email: string;
  password: string;
}

export async function signInWithPassword({ email, password }: SignInWithPasswordOptions): Promise<void> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    throw new AuthApiError('An email address is required to sign in.');
  }

  if (!password) {
    throw new AuthApiError('A password is required to sign in.');
  }

  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new AuthApiError('Invalid email or password. Please check your credentials and try again.', error);
    }
    throw new AuthApiError('Unable to sign in. Please try again.', error);
  }
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AuthApiError('Unable to sign out. Please try again.', error);
  }
}

export interface ResetPasswordRequestOptions {
  email: string;
  redirectTo?: string;
}

export async function requestPasswordReset({ email, redirectTo }: ResetPasswordRequestOptions): Promise<void> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    throw new AuthApiError('An email address is required to reset your password.');
  }

  const supabase = getSupabaseClient();

  const appUrl = import.meta.env.VITE_APP_URL;
  const defaultRedirect =
    redirectTo ??
    (appUrl ? `${appUrl}/auth` : undefined) ??
    (typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined);

  const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
    redirectTo: defaultRedirect,
  });

  if (error) {
    throw new AuthApiError('Unable to send password reset email. Please try again.', error);
  }
}

export interface UpdatePasswordOptions {
  newPassword: string;
}

export async function updatePassword({ newPassword }: UpdatePasswordOptions): Promise<void> {
  if (!newPassword || newPassword.length < 6) {
    throw new AuthApiError('Password must be at least 6 characters long.');
  }

  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new AuthApiError('Unable to update your password. Please try again.', error);
  }
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
  const entry: Database['public']['Tables']['auth_event_logs']['Insert'] = {
    ...payload,
    created_at: new Date().toISOString(),
  };
  const { error } = await (supabase.from('auth_event_logs') as unknown as {
    insert: (value: typeof entry) => Promise<{ error: unknown }>;
  }).insert(entry);

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

export interface SupabaseRankingRow {
  event_id: string;
  team_id: string;
  team_name: string;
  total_score: number | string | null;
  rank: number | string | null;
  delta_to_prev?: number | string | null;
  submitted_count?: number | string | null;
  criterion_scores?: unknown;
}

export interface SupabaseRankingsMetaRow {
  event_id: string;
  unlocked_at?: string | null;
  is_unlocked?: boolean | string | null;
  unlock_message?: string | null;
  unlock_eta?: string | null;
  judges_completed?: number | string | null;
  total_judges?: number | string | null;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toInteger(value: number | string | null | undefined): number | null {
  const parsed = toNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return null;
}

function parseCriterionScores(payload: unknown): RankingEntry['criterionScores'] {
  if (!payload) {
    return [];
  }

  let raw: unknown = payload;

  if (typeof payload === 'string') {
    try {
      raw = JSON.parse(payload);
    } catch (error) {
      console.warn('Failed to parse ranking criterion_scores payload', error);
      return [];
    }
  }

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => ({
      criterionId: typeof item?.criterion_id === 'string' ? item.criterion_id : '',
      label: typeof item?.label === 'string' ? item.label : '',
      averageScore: toNumber(item?.average_score) ?? 0,
      weight: typeof item?.weight === 'number' ? item.weight : toNumber(item?.weight),
    }))
    .filter((score) => Boolean(score.criterionId && score.label));
}

function mapRankingRow(row: SupabaseRankingRow): RankingEntry {
  const rank = toInteger(row.rank) ?? 0;
  const totalScore = toNumber(row.total_score) ?? 0;

  return {
    teamId: row.team_id,
    teamName: row.team_name,
    rank,
    totalScore,
    deltaToPrev: toNumber(row.delta_to_prev),
    submittedCount: toInteger(row.submitted_count),
    criterionScores: parseCriterionScores(row.criterion_scores),
  } satisfies RankingEntry;
}

export async function fetchRankings(eventId: string): Promise<RankingsSnapshot> {
  if (!eventId) {
    throw new RankingsApiError('An event identifier is required to load rankings.');
  }

  try {
    const supabase = getSupabaseClient();

    const rankingsPromise = supabase
      .from('rankings_view')
      .select('*')
      .eq('event_id', eventId)
      .order('rank', { ascending: true });

    const metaPromise = supabase
      .from('rankings_meta')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    const [rankingsResult, metaResult] = await Promise.all([rankingsPromise, metaPromise]);

    if (rankingsResult.error) {
      throw rankingsResult.error;
    }

    if (metaResult.error && metaResult.error.code !== 'PGRST116') {
      // `PGRST116` indicates the resource was not found; treat as optional metadata.
      console.warn('Failed to load rankings metadata', metaResult.error);
    }

    const rows = (rankingsResult.data ?? []) as SupabaseRankingRow[];
    const entries = rows.map(mapRankingRow);

    const meta = (metaResult.data ?? null) as SupabaseRankingsMetaRow | null;

    const explicitUnlock = toBoolean(meta?.is_unlocked);
    const unlockedAtFlag = meta?.unlocked_at ? true : null;
    const isUnlocked = explicitUnlock ?? unlockedAtFlag ?? entries.length > 0;

    const snapshot: RankingsSnapshot = {
      eventId,
      fetchedAt: new Date().toISOString(),
      entries,
      isUnlocked,
      unlockMessage: meta?.unlock_message ?? null,
      unlockedAt: meta?.unlocked_at ?? null,
      unlockEta: meta?.unlock_eta ?? null,
      judgesCompleted: toInteger(meta?.judges_completed) ?? null,
      totalJudges: toInteger(meta?.total_judges) ?? null,
      source: 'network',
    };

    return snapshot;
  } catch (error) {
    if (error instanceof RankingsApiError) {
      throw error;
    }

    if (error instanceof AuthApiError) {
      throw new RankingsApiError(error.message, error);
    }

    throw new RankingsApiError('We were unable to load the latest rankings. Please try again.', error);
  }
}

export interface SubscribeToRankingsOptions {
  eventId: string;
  onChange?: () => void;
  onStatusChange?: (state: RankingsConnectionState) => void;
  onError?: (error: RankingsApiError) => void;
}

export interface RankingsSubscription {
  unsubscribe: () => Promise<void>;
}

export async function subscribeToRankings({
  eventId,
  onChange,
  onError,
  onStatusChange,
}: SubscribeToRankingsOptions): Promise<RankingsSubscription | null> {
  if (!eventId) {
    return null;
  }

  try {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`rankings:${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rankings_view', filter: `event_id=eq.${eventId}` },
        () => {
          onChange?.();
        },
      )
      .subscribe((status) => {
        let mapped: RankingsConnectionState = 'connecting';
        switch (status) {
          case REALTIME_SUBSCRIBE_STATES.SUBSCRIBED:
            mapped = 'open';
            break;
          case REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR:
          case REALTIME_SUBSCRIBE_STATES.TIMED_OUT:
            mapped = 'error';
            break;
          case REALTIME_SUBSCRIBE_STATES.CLOSED:
            mapped = 'closed';
            break;
          default:
            mapped = 'connecting';
        }

        onStatusChange?.(mapped);
      });

    return {
      async unsubscribe() {
        await supabase.removeChannel(channel);
      },
    };
  } catch (error) {
    const apiError =
      error instanceof RankingsApiError
        ? error
        : new RankingsApiError('Unable to subscribe to rankings updates.', error);
    onError?.(apiError);
    return null;
  }
}

interface FetchAdminEventSummaryOptions {
  eventId?: string;
  signal?: AbortSignal;
}

interface AdminEventSummaryResult {
  snapshot: AdminEventSnapshot;
  isFallback: boolean;
  error?: AdminApiError;
}

function createFallbackAdminEventSnapshot(overrides?: Partial<AdminEventSnapshot>): AdminEventSnapshot {
  const now = new Date().toISOString();

  return {
    id: 'demo-event',
    name: 'Global Innovation Finals',
    description: 'Operations hub for the Hackathon Judge demo event.',
    code: 'GIF-2024',
    timezone: 'America/Los_Angeles',
    location: 'Crescent Ballroom · San Francisco, CA',
    startAt: '2024-02-23T16:30:00.000Z',
    endAt: '2024-02-24T01:00:00.000Z',
    totalJudges: 12,
    totalTeams: 8,
    fetchedAt: now,
    source: 'fallback',
    ...overrides,
  } satisfies AdminEventSnapshot;
}

interface ParsedAdminEventMetadata {
  timezone: string | null;
  location: string | null;
  startAt: string | null;
  endAt: string | null;
  totalJudges: number | null;
  totalTeams: number | null;
  code: string | null;
  description: string | null;
}

function parseAdminEventMetadata(metadata: unknown): ParsedAdminEventMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return {
      timezone: null,
      location: null,
      startAt: null,
      endAt: null,
      totalJudges: null,
      totalTeams: null,
      code: null,
      description: null,
    } satisfies ParsedAdminEventMetadata;
  }

  const record = metadata as Record<string, unknown>;

  const timezone = typeof record.timezone === 'string' ? record.timezone : null;
  const location = typeof record.location === 'string' ? record.location : null;
  const startAt =
    typeof record.start_at === 'string'
      ? record.start_at
      : typeof record.startAt === 'string'
        ? record.startAt
        : null;
  const endAt =
    typeof record.end_at === 'string'
      ? record.end_at
      : typeof record.endAt === 'string'
        ? record.endAt
        : null;
  const totalJudges =
    toInteger(record.total_judges as string | number | null | undefined) ??
    toInteger(record.judge_count as string | number | null | undefined) ??
    null;
  const totalTeams =
    toInteger(record.total_teams as string | number | null | undefined) ??
    toInteger(record.team_count as string | number | null | undefined) ??
    null;
  const code =
    typeof record.code === 'string'
      ? record.code
      : typeof record.short_name === 'string'
        ? record.short_name
        : typeof record.slug === 'string'
          ? record.slug
          : null;
  const description =
    typeof record.summary === 'string'
      ? record.summary
      : typeof record.tagline === 'string'
        ? record.tagline
        : null;

  return {
    timezone,
    location,
    startAt,
    endAt,
    totalJudges,
    totalTeams,
    code,
    description,
  } satisfies ParsedAdminEventMetadata;
}

export async function fetchAdminEventSummary({
  eventId,
}: FetchAdminEventSummaryOptions = {}): Promise<AdminEventSummaryResult> {
  const targetEventId = eventId ?? 'demo-event';

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('events')
      .select('id,name,description,metadata')
      .eq('id', targetEventId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      const fallback = createFallbackAdminEventSnapshot({ id: targetEventId });
      return {
        snapshot: fallback,
        isFallback: true,
        error: new AdminApiError('Event metadata is not available.'),
      } satisfies AdminEventSummaryResult;
    }

    const row = data as Database['public']['Tables']['events']['Row'];
    const metadata = parseAdminEventMetadata(row.metadata);

    const snapshot: AdminEventSnapshot = {
      id: row.id,
      name: row.name,
      description: row.description ?? metadata.description ?? null,
      code: metadata.code ?? row.id,
      timezone: metadata.timezone,
      location: metadata.location,
      startAt: metadata.startAt,
      endAt: metadata.endAt,
      totalJudges: metadata.totalJudges,
      totalTeams: metadata.totalTeams,
      fetchedAt: new Date().toISOString(),
      source: 'supabase',
    } satisfies AdminEventSnapshot;

    return {
      snapshot,
      isFallback: false,
    } satisfies AdminEventSummaryResult;
  } catch (error) {
    if (error instanceof AuthApiError) {
      return {
        snapshot: createFallbackAdminEventSnapshot({ id: targetEventId }),
        isFallback: true,
      } satisfies AdminEventSummaryResult;
    }

    const adminError =
      error instanceof AdminApiError
        ? error
        : new AdminApiError('Unable to load the event overview.', error);

    return {
      snapshot: createFallbackAdminEventSnapshot({ id: targetEventId }),
      isFallback: true,
      error: adminError,
    } satisfies AdminEventSummaryResult;
  }
}

interface SupabaseTimerStateRow {
  event_id: string;
  phase: TimerPhase | null;
  duration_seconds: number | null;
  started_at: string | null;
  paused_at: string | null;
  control_owner: string | null;
  updated_at: string | null;
  revision: number | string | null;
}

interface SupabaseTimerPresetRow {
  id: string;
  event_id: string;
  label: string;
  duration_seconds: number | null;
  is_default: boolean | null;
  archived_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SupabaseTimerShareLinkRow {
  url: string;
  token: string;
  expires_at: string;
  created_at: string;
}

function mapTimerState(row: SupabaseTimerStateRow, source: TimerSnapshot['source'] = 'network'): TimerSnapshot {
  const now = new Date().toISOString();
  const revisionRaw = row.revision;
  const revision = typeof revisionRaw === 'number' ? revisionRaw : parseInt(revisionRaw ?? '0', 10) || 0;

  return {
    eventId: row.event_id,
    phase: (row.phase ?? 'idle') as TimerPhase,
    durationSeconds: row.duration_seconds ?? 0,
    startedAt: row.started_at,
    pausedAt: row.paused_at,
    controlOwner: row.control_owner,
    updatedAt: row.updated_at ?? now,
    revision,
    fetchedAt: now,
    source,
  } satisfies TimerSnapshot;
}

function mapTimerPreset(row: SupabaseTimerPresetRow): TimerPreset {
  return {
    id: row.id,
    eventId: row.event_id,
    label: row.label,
    durationSeconds: row.duration_seconds ?? 0,
    isDefault: Boolean(row.is_default),
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies TimerPreset;
}

function mapTimerShareLink(row: SupabaseTimerShareLinkRow): TimerShareLink {
  return {
    url: row.url,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  } satisfies TimerShareLink;
}

export interface FetchTimerStateOptions {
  eventId: string;
}

export interface FetchTimerStateResult {
  snapshot: TimerSnapshot;
  isFallback: boolean;
  error?: TimerApiError;
}

export async function fetchTimerState({ eventId }: FetchTimerStateOptions): Promise<FetchTimerStateResult> {
  if (!eventId) {
    throw new TimerApiError('An event identifier is required to load the timer state.');
  }

  try {
    const supabase = getSupabaseClient();
    const query = supabase
      .from('event_timer_state')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    const { data, error } = await query;

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return {
        snapshot: createFallbackTimerSnapshot({ eventId }),
        isFallback: true,
      } satisfies FetchTimerStateResult;
    }

    return {
      snapshot: mapTimerState(data as SupabaseTimerStateRow),
      isFallback: false,
    } satisfies FetchTimerStateResult;
  } catch (error) {
    const timerError =
      error instanceof TimerApiError
        ? error
        : new TimerApiError('Unable to load the live timer state.', error);

    return {
      snapshot: createFallbackTimerSnapshot({ eventId }),
      isFallback: true,
      error: timerError,
    } satisfies FetchTimerStateResult;
  }
}

export interface SubscribeToTimerStateOptions {
  eventId: string;
  onUpdate?: (snapshot: TimerSnapshot) => void;
  onStatusChange?: (state: TimerConnectionState) => void;
  onError?: (error: TimerApiError) => void;
}

export interface TimerSubscription {
  unsubscribe: () => Promise<void>;
}

export async function subscribeToTimerState({
  eventId,
  onUpdate,
  onStatusChange,
  onError,
}: SubscribeToTimerStateOptions): Promise<TimerSubscription | null> {
  if (!eventId) {
    return null;
  }

  try {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`timer:${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_timer_state', filter: `event_id=eq.${eventId}` },
        (payload) => {
          const record = (payload.new ?? payload.old) as SupabaseTimerStateRow | null;
          if (record) {
            onUpdate?.(mapTimerState(record));
          }
        },
      )
      .subscribe((status) => {
        let mapped: TimerConnectionState = 'connecting';
        switch (status) {
          case REALTIME_SUBSCRIBE_STATES.SUBSCRIBED:
            mapped = 'open';
            break;
          case REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR:
          case REALTIME_SUBSCRIBE_STATES.TIMED_OUT:
            mapped = 'error';
            break;
          case REALTIME_SUBSCRIBE_STATES.CLOSED:
            mapped = 'closed';
            break;
          default:
            mapped = 'connecting';
        }

        onStatusChange?.(mapped);
      });

    return {
      async unsubscribe() {
        await supabase.removeChannel(channel);
      },
    } satisfies TimerSubscription;
  } catch (error) {
    const timerError =
      error instanceof TimerApiError
        ? error
        : new TimerApiError('Unable to subscribe to timer updates.', error);
    onError?.(timerError);
    return null;
  }
}

export interface ListTimerPresetsOptions {
  eventId: string;
  includeArchived?: boolean;
}

export async function listTimerPresets({
  eventId,
  includeArchived = false,
}: ListTimerPresetsOptions): Promise<TimerPreset[]> {
  if (!eventId) {
    throw new TimerApiError('An event identifier is required to load timer presets.');
  }

  try {
    const supabase = getSupabaseClient();
    let query = supabase.from('event_timer_presets').select('*').eq('event_id', eventId);

    if (!includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query
      .order('is_default', { ascending: false })
      .order('duration_seconds', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapTimerPreset(row as SupabaseTimerPresetRow));
  } catch (error) {
    const timerError =
      error instanceof TimerApiError
        ? error
        : new TimerApiError('Unable to load timer presets.', error);
    console.warn(timerError.message, timerError.cause);
    return fallbackTimerPresets.filter((preset) => preset.eventId === eventId || preset.eventId === 'demo-event');
  }
}

export interface UpsertTimerPresetOptions {
  preset: TimerPreset;
}

export async function upsertTimerPreset({ preset }: UpsertTimerPresetOptions): Promise<TimerPreset> {
  try {
    const supabase = getSupabaseClient();
    const record: Database['public']['Tables']['event_timer_presets']['Insert'] = {
      id: preset.id,
      event_id: preset.eventId,
      label: preset.label,
      duration_seconds: preset.durationSeconds,
      is_default: preset.isDefault,
      archived_at: preset.archivedAt,
    };
    const { data, error } = await (supabase.from('event_timer_presets') as unknown as {
      upsert: (
        value: Database['public']['Tables']['event_timer_presets']['Insert'],
      ) => {
        select: (columns: '*') => { single: () => Promise<{ data: unknown; error: unknown }> };
      };
    })
      .upsert(record)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapTimerPreset(data as SupabaseTimerPresetRow);
  } catch (error) {
    throw error instanceof TimerApiError
      ? error
      : new TimerApiError('Unable to save the timer preset.', error);
  }
}

export interface TriggerTimerActionOptions {
  eventId: string;
  action: TimerControlAction;
  presetId?: string | null;
  durationSeconds?: number | null;
}

export async function triggerTimerAction({
  eventId,
  action,
  presetId,
  durationSeconds,
}: TriggerTimerActionOptions): Promise<TimerSnapshot> {
  if (!eventId) {
    throw new TimerApiError('An event identifier is required to control the timer.');
  }

  try {
    const supabase = getSupabaseClient();
    const args: Database['public']['Functions']['call_timer_action']['Args'] = {
      event_id: eventId,
      action,
      preset_id: presetId ?? null,
      duration_seconds: durationSeconds ?? null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc('call_timer_action' as any, args as any) as any);

    if (error) {
      throw error;
    }

    const payload = (data as Record<string, unknown>) ?? {};
    const state = (payload.state ?? payload.timer_state ?? payload) as SupabaseTimerStateRow;
    return mapTimerState(state);
  } catch (error) {
    throw error instanceof TimerApiError
      ? error
      : new TimerApiError('Unable to process the timer action. Please try again.', error);
  }
}

export interface GenerateTimerShareLinkOptions {
  eventId: string;
  tokenTtlMinutes?: number;
}

export interface GenerateTimerShareLinkResult {
  link: TimerShareLink;
  isFallback: boolean;
  error?: TimerApiError;
}

export async function generateTimerShareLink({
  eventId,
  tokenTtlMinutes = 30,
}: GenerateTimerShareLinkOptions): Promise<GenerateTimerShareLinkResult> {
  if (!eventId) {
    throw new TimerApiError('An event identifier is required to generate a share link.');
  }

  try {
    const supabase = getSupabaseClient();
    const args: Database['public']['Functions']['generate_timer_share_link']['Args'] = {
      event_id: eventId,
      token_ttl_minutes: tokenTtlMinutes,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc('generate_timer_share_link' as any, args as any) as any);

    if (error) {
      throw error;
    }

    return {
      link: mapTimerShareLink(data as SupabaseTimerShareLinkRow),
      isFallback: false,
    } satisfies GenerateTimerShareLinkResult;
  } catch (error) {
    const timerError =
      error instanceof TimerApiError
        ? error
        : new TimerApiError('Unable to generate a timer share link.', error);

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + tokenTtlMinutes * 60_000);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
    const fallbackToken = `${eventId}-demo-token`;
    const url = `${origin}/timer?token=${encodeURIComponent(fallbackToken)}&eventId=${encodeURIComponent(eventId)}`;

    return {
      link: {
        url,
        token: fallbackToken,
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      isFallback: true,
      error: timerError,
    } satisfies GenerateTimerShareLinkResult;
  }
}

export interface ValidateTimerShareTokenOptions {
  token: string;
}

export async function validateTimerShareToken({ token }: ValidateTimerShareTokenOptions): Promise<TimerTokenValidationResult> {
  if (!token) {
    throw new TimerApiError('A share token is required to access the timer display.');
  }

  try {
    const supabase = getSupabaseClient();
    const args: Database['public']['Functions']['validate_timer_share_token']['Args'] = {
      token,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc('validate_timer_share_token' as any, args as any) as any);

    if (error) {
      throw error;
    }

    const payload = (data as Record<string, unknown>) ?? {};
    return {
      eventId: String(payload.event_id ?? ''),
      token,
      expiresAt: String(payload.expires_at ?? new Date().toISOString()),
      isExpired: Boolean(payload.is_expired ?? false),
    } satisfies TimerTokenValidationResult;
  } catch {
    const now = new Date();
    return {
      eventId: 'demo-event',
      token,
      expiresAt: new Date(now.getTime() + 30 * 60_000).toISOString(),
      isExpired: false,
    } satisfies TimerTokenValidationResult;
  }
}
