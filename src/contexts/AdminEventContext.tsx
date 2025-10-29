import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { fetchAdminEventSummary } from '@/lib/api';
import type { AdminEventSnapshot } from '@/types/admin';

interface AdminEventContextValue {
  event: AdminEventSnapshot | null;
  isLoading: boolean;
  error: Error | null;
  isFallback: boolean;
  lastLoadedAt: Date | null;
  refresh: () => Promise<void>;
}

const AdminEventContext = createContext<AdminEventContextValue | undefined>(undefined);

interface AdminEventProviderProps {
  eventId?: string | null;
  children: ReactNode;
}

interface AdminEventState {
  event: AdminEventSnapshot | null;
  isLoading: boolean;
  error: Error | null;
  isFallback: boolean;
  lastLoadedAt: Date | null;
}

export function AdminEventProvider({ eventId, children }: AdminEventProviderProps) {
  const targetEventId = eventId ?? 'demo-event';
  const mountedRef = useRef(true);
  const [state, setState] = useState<AdminEventState>({
    event: null,
    isLoading: true,
    error: null,
    isFallback: false,
    lastLoadedAt: null,
  });

  const load = useCallback(async () => {
    setState((previous) => ({ ...previous, isLoading: true, error: null }));

    try {
      const { snapshot, isFallback, error } = await fetchAdminEventSummary({ eventId: targetEventId });

      if (!mountedRef.current) {
        return;
      }

      setState({
        event: snapshot,
        isLoading: false,
        isFallback,
        error: error ?? null,
        lastLoadedAt: snapshot.fetchedAt ? new Date(snapshot.fetchedAt) : new Date(),
      });
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      setState((previous) => ({
        ...previous,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unable to load the event overview.'),
      }));
    }
  }, [targetEventId]);

  useEffect(() => {
    mountedRef.current = true;
    void load();

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const value = useMemo<AdminEventContextValue>(
    () => ({
      ...state,
      refresh: load,
    }),
    [state, load],
  );

  return <AdminEventContext.Provider value={value}>{children}</AdminEventContext.Provider>;
}

export function useAdminEventContext(): AdminEventContextValue {
  const context = useContext(AdminEventContext);

  if (!context) {
    throw new Error('useAdminEventContext must be used within an AdminEventProvider.');
  }

  return context;
}
