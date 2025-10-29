import { RotateCcw, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { TimerBadge } from '@/components/timer/TimerBadge';
import { getCountdownParts } from '@/lib/timer-utils';
import { TimerApiError, validateTimerShareToken } from '@/lib/api';
import { useEventTimer } from '@/hooks/useEventTimer';

interface TokenState {
  eventId: string;
  isExpired: boolean;
}

function phaseLabel(phase: string | undefined) {
  switch (phase) {
    case 'running':
      return 'Finals pitch underway';
    case 'paused':
      return 'Timer paused';
    case 'completed':
      return 'Segment complete';
    default:
      return 'Awaiting start';
  }
}

export function TimerDisplayPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const queryEventId = searchParams.get('eventId');
  const [tokenState, setTokenState] = useState<TokenState>({ eventId: queryEventId ?? 'demo-event', isExpired: false });
  const [tokenError, setTokenError] = useState<TimerApiError | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setTokenState((previous) => ({ ...previous, eventId: queryEventId ?? previous.eventId }));
      setTokenError(null);
      return () => {
        isMounted = false;
      };
    }

    setIsValidating(true);
    validateTimerShareToken({ token })
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setTokenState({ eventId: result.eventId || queryEventId || 'demo-event', isExpired: result.isExpired });
        setTokenError(null);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        const timerError =
          error instanceof TimerApiError
            ? error
            : new TimerApiError('Unable to validate the share token.', error);
        setTokenError(timerError);
        setTokenState({ eventId: queryEventId ?? 'demo-event', isExpired: false });
      })
      .finally(() => {
        if (isMounted) {
          setIsValidating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [queryEventId, token]);

  const timer = useEventTimer({ eventId: tokenState.eventId, enabled: Boolean(tokenState.eventId) });
  const { minutes, seconds } = useMemo(
    () => getCountdownParts(timer.remainingMs),
    [timer.remainingMs],
  );

  return (
    <div className="relative -mx-4 flex min-h-[70vh] flex-col gap-8 rounded-3xl border border-surface-border/60 bg-surface-elevated/80 px-6 py-10 text-white shadow-[0_20px_80px_rgba(15,23,42,0.45)] sm:-mx-8 sm:px-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-brand-200">Central finals timer</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Stay perfectly in sync</h1>
        <p className="max-w-xl text-sm text-neutral-300">
          This display updates in realtime from the operations console. Keep this screen visible to your panel and production crew.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-6">
        <div className="rounded-[2.5rem] border border-white/15 bg-white/[0.08] px-10 py-12 text-center shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <div className="flex items-baseline justify-center gap-6 font-mono text-[clamp(4rem,12vw,8rem)] font-semibold tracking-tight text-white">
            <span>{minutes}</span>
            <span className="text-[clamp(3rem,8vw,6rem)]">:</span>
            <span>{seconds}</span>
          </div>
          <p className="mt-6 text-lg font-medium text-white/80">{phaseLabel(timer.snapshot?.phase)}</p>
          <p className="mt-2 text-sm text-neutral-300">
            {timer.snapshot?.controlOwner ? `Managed by ${timer.snapshot.controlOwner}` : 'Operations can update presets and control playback.'}
          </p>
        </div>

        <TimerBadge
          remainingMs={timer.remainingMs}
          phase={timer.snapshot?.phase ?? 'idle'}
          connectionState={timer.connectionState}
          isOffline={timer.isOffline}
          driftMs={timer.driftMs}
          lastSyncedAt={timer.lastSyncedAt}
          controlOwner={timer.snapshot?.controlOwner ?? undefined}
          disabled
        />
      </div>

      <div className="flex flex-col items-center gap-4 text-center text-sm text-neutral-200">
        <div className="inline-flex items-center gap-2 rounded-full border border-surface-border/60 bg-surface-muted/60 px-4 py-2 text-xs uppercase tracking-[0.28em] text-neutral-400">
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Rotate device for landscape displays
        </div>
        <p>
          For the best experience, mirror this browser window to the stage screen, enable full-screen mode (<kbd className="rounded border border-white/30 px-1">F11</kbd>), and disable browser toolbars.
        </p>
      </div>

      {isValidating ? (
        <div className="rounded-2xl border border-surface-border/70 bg-surface-muted/60 px-4 py-3 text-sm text-neutral-200">
          Validating share link…
        </div>
      ) : null}

      {tokenError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          {tokenError.message}
        </div>
      ) : null}

      {tokenState.isExpired ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
          This share link has expired. Ask an admin to generate a fresh timer link or re-authenticate using your event credentials.
        </div>
      ) : null}
    </div>
  );
}
