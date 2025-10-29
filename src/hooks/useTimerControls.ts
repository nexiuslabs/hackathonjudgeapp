import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  generateTimerShareLink,
  listTimerPresets,
  TimerApiError,
  triggerTimerAction,
  type GenerateTimerShareLinkResult,
} from '@/lib/api';
import { deriveOptimisticTimerSnapshot } from '@/lib/timer-utils';
import type { TimerControlAction, TimerPreset, TimerShareLink } from '@/types/timer';

import type { UseEventTimerResult } from './useEventTimer';

export interface UseTimerControlsOptions {
  eventId: string;
  timer: Pick<
    UseEventTimerResult,
    | 'snapshot'
    | 'applyOptimisticSnapshot'
    | 'revertOptimisticSnapshot'
    | 'confirmOptimisticSnapshot'
    | 'refresh'
  >;
  controlOwner?: string | null;
}

interface PendingAction {
  id: string;
  type: TimerControlAction;
}

interface ShareLinkState {
  link: TimerShareLink | null;
  isFallback: boolean;
  error: TimerApiError | null;
}

export interface UseTimerControlsResult {
  presets: TimerPreset[];
  isLoadingPresets: boolean;
  presetError: TimerApiError | null;
  selectedPresetId: string | null;
  setSelectedPresetId: (presetId: string | null) => void;
  refreshPresets: () => Promise<void>;
  pendingAction: PendingAction | null;
  actionError: TimerApiError | null;
  startTimer: (presetId?: string | null) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  resetTimer: (options?: { presetId?: string | null; durationSeconds?: number }) => Promise<void>;
  share: ShareLinkState & {
    generate: () => Promise<void>;
    clear: () => void;
    isGenerating: boolean;
  };
}

function createActionId(prefix: TimerControlAction): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useTimerControls({ eventId, timer, controlOwner = null }: UseTimerControlsOptions): UseTimerControlsResult {
  const [presets, setPresets] = useState<TimerPreset[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [presetError, setPresetError] = useState<TimerApiError | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<TimerApiError | null>(null);
  const [shareState, setShareState] = useState<ShareLinkState>({ link: null, isFallback: false, error: null });
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshPresets = useCallback(async () => {
    if (!eventId) {
      setPresetError(new TimerApiError('An event identifier is required to load presets.'));
      setIsLoadingPresets(false);
      return;
    }

    setIsLoadingPresets(true);
    setPresetError(null);

    try {
      const items = await listTimerPresets({ eventId });
      if (!mountedRef.current) {
        return;
      }

      setPresets(items);
      if (!selectedPresetId || !items.some((preset) => preset.id === selectedPresetId)) {
        const defaultPreset = items.find((preset) => preset.isDefault) ?? items[0] ?? null;
        setSelectedPresetId(defaultPreset?.id ?? null);
      }
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      const timerError =
        error instanceof TimerApiError ? error : new TimerApiError('Unable to load timer presets.', error);
      setPresetError(timerError);
    } finally {
      if (mountedRef.current) {
        setIsLoadingPresets(false);
      }
    }
  }, [eventId, selectedPresetId]);

  useEffect(() => {
    void refreshPresets();
  }, [refreshPresets]);

  const resolvePreset = useCallback(
    (presetId?: string | null): TimerPreset | null => {
      if (!presetId) {
        return presets.find((preset) => preset.id === selectedPresetId) ?? presets[0] ?? null;
      }

      return presets.find((preset) => preset.id === presetId) ?? null;
    },
    [presets, selectedPresetId],
  );

  const runAction = useCallback(
    async (action: TimerControlAction, options?: { presetId?: string | null; durationSeconds?: number }) => {
      if (!eventId) {
        const error = new TimerApiError('An event identifier is required to control the timer.');
        setActionError(error);
        throw error;
      }

      if (pendingAction) {
        return;
      }

      const targetPreset = resolvePreset(options?.presetId);
      const durationSeconds = options?.durationSeconds ?? targetPreset?.durationSeconds ?? timer.snapshot?.durationSeconds ?? 0;
      const actionId = createActionId(action);
      const optimisticSnapshot = deriveOptimisticTimerSnapshot({
        current: timer.snapshot,
        action,
        eventId,
        durationSeconds,
        controlOwner,
      });

      timer.applyOptimisticSnapshot(actionId, optimisticSnapshot);
      setPendingAction({ id: actionId, type: action });
      setActionError(null);

      try {
        const updated = await triggerTimerAction({
          eventId,
          action,
          presetId: targetPreset?.id ?? null,
          durationSeconds,
        });
        timer.confirmOptimisticSnapshot(actionId, updated);
        await timer.refresh('manual');
      } catch (error) {
        const timerError =
          error instanceof TimerApiError
            ? error
            : new TimerApiError('We could not update the timer. Please try again.', error);
        setActionError(timerError);
        timer.revertOptimisticSnapshot(actionId);
        throw timerError;
      } finally {
        if (mountedRef.current) {
          setPendingAction(null);
        }
      }
    },
    [controlOwner, eventId, pendingAction, resolvePreset, timer],
  );

  const startTimer = useCallback(
    async (presetId?: string | null) => {
      await runAction('start', { presetId });
    },
    [runAction],
  );

  const pauseTimer = useCallback(async () => {
    await runAction('pause');
  }, [runAction]);

  const resumeTimer = useCallback(async () => {
    await runAction('resume');
  }, [runAction]);

  const resetTimer = useCallback(
    async (options?: { presetId?: string | null; durationSeconds?: number }) => {
      await runAction('reset', options);
    },
    [runAction],
  );

  const generateShareLink = useCallback(async () => {
    if (!eventId) {
      const error = new TimerApiError('An event identifier is required to generate a share link.');
      setShareState({ link: null, isFallback: false, error });
      throw error;
    }

    setIsGeneratingShareLink(true);
    setShareState((previous) => ({ ...previous, error: null }));

    try {
      const result: GenerateTimerShareLinkResult = await generateTimerShareLink({ eventId });
      if (!mountedRef.current) {
        return;
      }

      setShareState({ link: result.link, isFallback: result.isFallback, error: result.error ?? null });
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      const timerError =
        error instanceof TimerApiError ? error : new TimerApiError('Unable to generate a share link.', error);
      setShareState({ link: null, isFallback: false, error: timerError });
      throw timerError;
    } finally {
      if (mountedRef.current) {
        setIsGeneratingShareLink(false);
      }
    }
  }, [eventId]);

  const clearShareLink = useCallback(() => {
    setShareState({ link: null, isFallback: false, error: null });
  }, []);

  const share = useMemo(
    () => ({
      ...shareState,
      isGenerating: isGeneratingShareLink,
      generate: generateShareLink,
      clear: clearShareLink,
    }),
    [clearShareLink, generateShareLink, isGeneratingShareLink, shareState],
  );

  return {
    presets,
    isLoadingPresets,
    presetError,
    selectedPresetId,
    setSelectedPresetId,
    refreshPresets,
    pendingAction,
    actionError,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    share,
  } satisfies UseTimerControlsResult;
}
