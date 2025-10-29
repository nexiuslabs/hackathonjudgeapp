import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { AuthApiError, getSession } from '@/lib/api';
import { isAdminRole, type PermissionRole } from '@/types/permissions';

type PermissionsSource = 'supabase' | 'fallback';

interface PermissionsSnapshot {
  role: PermissionRole | null;
  eventId: string | null;
  email: string | null;
  fullName: string | null;
  source: PermissionsSource;
}

const FALLBACK_PERMISSIONS: PermissionsSnapshot = {
  role: 'admin',
  eventId: 'demo-event',
  email: null,
  fullName: 'Operations Console',
  source: 'fallback',
};

let cachedPermissions: PermissionsSnapshot | null = null;

const ROLE_ALIASES: Record<string, PermissionRole> = {
  judge: 'judge',
  'head_judge': 'head_judge',
  'head-judge': 'head_judge',
  headjudge: 'head_judge',
  operations: 'operations',
  ops: 'operations',
  coordinator: 'operations',
  admin: 'admin',
  administrator: 'admin',
  owner: 'owner',
  organiser: 'owner',
  organizer: 'owner',
  'super_admin': 'owner',
  superadmin: 'owner',
};

const isSupabaseConfigured = Boolean(
  import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY,
);

function normaliseRole(value: unknown): PermissionRole | null {
  if (typeof value !== 'string') {
    return null;
  }

  return ROLE_ALIASES[value.toLowerCase()] ?? null;
}

function deriveEventId(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const record = metadata as Record<string, unknown>;

  if (typeof record.event_id === 'string') {
    return record.event_id;
  }

  if (typeof record.eventId === 'string') {
    return record.eventId;
  }

  if (Array.isArray(record.events) && record.events.length > 0) {
    const [first] = record.events;
    if (typeof first === 'string') {
      return first;
    }
  }

  return null;
}

function createSnapshotFromSession(session: Session | null): PermissionsSnapshot {
  if (!session) {
    return {
      role: null,
      eventId: null,
      email: null,
      fullName: null,
      source: 'supabase',
    } satisfies PermissionsSnapshot;
  }

  const { user } = session;
  const userMetadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const appMetadata = (user?.app_metadata ?? {}) as Record<string, unknown>;

  const role =
    normaliseRole(userMetadata.role) ??
    normaliseRole(appMetadata.role) ??
    (Array.isArray(userMetadata.roles) ? normaliseRole(userMetadata.roles[0]) : null) ??
    (Array.isArray(appMetadata.roles) ? normaliseRole(appMetadata.roles[0]) : null);

  const eventId =
    deriveEventId(userMetadata) ??
    deriveEventId(appMetadata) ??
    (typeof userMetadata.event === 'string' ? userMetadata.event : null);

  const email = typeof user?.email === 'string' ? user.email : null;
  const fullName =
    typeof userMetadata.full_name === 'string'
      ? userMetadata.full_name
      : typeof userMetadata.name === 'string'
        ? userMetadata.name
        : typeof appMetadata.full_name === 'string'
          ? appMetadata.full_name
          : typeof appMetadata.name === 'string'
            ? appMetadata.name
            : null;

  return {
    role,
    eventId,
    email,
    fullName,
    source: 'supabase',
  } satisfies PermissionsSnapshot;
}

function readLocalOverrides(): Partial<PermissionsSnapshot> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem('hackathonjudgeapp.permissions');
    if (!raw) {
      const role = normaliseRole(window.localStorage.getItem('hackathonjudgeapp.role'));
      const eventId = window.localStorage.getItem('hackathonjudgeapp.eventId');
      const fullName = window.localStorage.getItem('hackathonjudgeapp.fullName') ?? undefined;
      const email = window.localStorage.getItem('hackathonjudgeapp.email') ?? undefined;

      if (!role && !eventId && !fullName && !email) {
        return {};
      }

      return {
        role: role ?? undefined,
        eventId: eventId ?? undefined,
        fullName: fullName ?? undefined,
        email: email ?? undefined,
        source: 'fallback',
      };
    }

    const parsed = JSON.parse(raw) as Partial<Record<keyof PermissionsSnapshot, unknown>>;
    return {
      role: normaliseRole(parsed.role),
      eventId: typeof parsed.eventId === 'string' ? parsed.eventId : undefined,
      email: typeof parsed.email === 'string' ? parsed.email : undefined,
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : undefined,
      source: 'fallback',
    };
  } catch (error) {
    console.warn('Failed to read local permission overrides', error);
    return {};
  }
}

function buildFallbackPermissions(): PermissionsSnapshot {
  const overrides = readLocalOverrides();

  const role = overrides.role ?? FALLBACK_PERMISSIONS.role;
  const eventId = overrides.eventId ?? FALLBACK_PERMISSIONS.eventId;
  const email = overrides.email ?? FALLBACK_PERMISSIONS.email;
  const fullName = overrides.fullName ?? FALLBACK_PERMISSIONS.fullName;

  return {
    role,
    eventId,
    email,
    fullName,
    source: 'fallback',
  } satisfies PermissionsSnapshot;
}

interface PermissionViewState extends PermissionsSnapshot {
  canAccessAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface UsePermissionsResult extends PermissionViewState {
  refresh: () => Promise<void>;
}

function enrichSnapshot(snapshot: PermissionsSnapshot): PermissionsSnapshot {
  if (!snapshot.role) {
    return snapshot;
  }

  const fallback = buildFallbackPermissions();

  return {
    role: snapshot.role ?? fallback.role,
    eventId: snapshot.eventId ?? (isAdminRole(snapshot.role) ? fallback.eventId : null),
    email: snapshot.email ?? fallback.email,
    fullName: snapshot.fullName ?? (isAdminRole(snapshot.role) ? fallback.fullName : null),
    source: snapshot.source,
  } satisfies PermissionsSnapshot;
}

export function usePermissions(): UsePermissionsResult {
  const [state, setState] = useState<PermissionViewState>(() => {
    if (cachedPermissions) {
      return {
        ...cachedPermissions,
        canAccessAdmin: isAdminRole(cachedPermissions.role),
        isLoading: false,
        error: null,
      } satisfies PermissionViewState;
    }

    if (!isSupabaseConfigured) {
      const fallback = buildFallbackPermissions();
      cachedPermissions = fallback;
      return {
        ...fallback,
        canAccessAdmin: isAdminRole(fallback.role),
        isLoading: false,
        error: null,
      } satisfies PermissionViewState;
    }

    return {
      role: null,
      eventId: null,
      email: null,
      fullName: null,
      source: 'supabase',
      canAccessAdmin: false,
      isLoading: true,
      error: null,
    } satisfies PermissionViewState;
  });

  const load = useCallback(async () => {
    setState((previous) => ({ ...previous, isLoading: true, error: null }));

    try {
      const session = await getSession();
      const rawSnapshot = createSnapshotFromSession(session);

      if (!isSupabaseConfigured) {
        const fallback = buildFallbackPermissions();
        cachedPermissions = fallback;
        setState({
          ...fallback,
          canAccessAdmin: isAdminRole(fallback.role),
          isLoading: false,
          error: null,
        });
        return;
      }

      const snapshot = enrichSnapshot(rawSnapshot);
      cachedPermissions = snapshot;
      setState({
        ...snapshot,
        canAccessAdmin: isAdminRole(snapshot.role),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      if (error instanceof AuthApiError && !isSupabaseConfigured) {
        const fallback = buildFallbackPermissions();
        cachedPermissions = fallback;
        setState({
          ...fallback,
          canAccessAdmin: isAdminRole(fallback.role),
          isLoading: false,
          error: null,
        });
        return;
      }

      if (cachedPermissions) {
        setState({
          ...cachedPermissions,
          canAccessAdmin: isAdminRole(cachedPermissions.role),
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unable to refresh permissions.'),
        });
        return;
      }

      const fallback = buildFallbackPermissions();
      cachedPermissions = fallback;
      setState({
        ...fallback,
        canAccessAdmin: isAdminRole(fallback.role),
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unable to load permissions.'),
      });
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || cachedPermissions) {
      return;
    }

    load();
  }, [load]);

  return {
    ...state,
    refresh: load,
  };
}
