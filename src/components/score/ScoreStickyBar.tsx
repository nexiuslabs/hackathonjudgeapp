import { Loader2, WifiOff } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ScoreFormStatus = 'incomplete' | 'ready' | 'pending';

export interface ScoreStickyBarProps {
  total: number;
  maxTotal?: number;
  missingCount: number;
  status: ScoreFormStatus;
  onSubmit: () => void;
  onSaveDraft?: () => void;
  lastUpdated?: Date | null;
  isOffline?: boolean;
}

function formatStatusCopy(status: ScoreFormStatus, missingCount: number, isOffline: boolean | undefined) {
  switch (status) {
    case 'ready':
      return isOffline
        ? 'All criteria scored. Scores will queue until your connection returns.'
        : 'All criteria scored. Submit when you are ready.';
    case 'pending':
      return 'Submitting your scores… hold tight.';
    default:
      if (isOffline) {
        return missingCount > 1
          ? `Offline mode active—score the remaining ${missingCount} criteria to continue.`
          : 'Offline mode active—score the remaining criterion to continue.';
      }

      return missingCount > 1
        ? `Score the remaining ${missingCount} criteria to continue.`
        : 'Score the remaining criterion to continue.';
  }
}

export function ScoreStickyBar({
  total,
  maxTotal = 100,
  missingCount,
  status,
  onSubmit,
  onSaveDraft,
  lastUpdated,
  isOffline,
}: ScoreStickyBarProps) {
  const formattedTotal = `${total.toFixed(1)} / ${maxTotal}`;
  const statusCopy = formatStatusCopy(status, missingCount, isOffline);
  const isBlocked = status !== 'ready';

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-border/70 bg-surface-elevated/95 px-4 py-4 shadow-lg backdrop-blur lg:px-12"
      role="region"
      aria-label="Score submission summary"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 text-sm text-neutral-300">
          <div className="flex items-center gap-3 text-base font-semibold text-white">
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-brand-200" aria-live="polite">
              Total {formattedTotal}
            </span>
            {isOffline ? (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-200">
                <WifiOff className="h-4 w-4" aria-hidden="true" /> Offline mode
              </span>
            ) : null}
          </div>
          <span>{statusCopy}</span>
          {lastUpdated ? (
            <span className="text-xs text-neutral-500">
              Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            className="w-full rounded-full border border-surface-border/70 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-brand-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:w-auto"
            onClick={onSaveDraft}
          >
            Save & Exit
          </button>
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-neutral-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated/95 focus-visible:ring-brand-300 sm:w-auto',
              isBlocked && 'cursor-not-allowed opacity-60',
            )}
            aria-disabled={isBlocked}
            disabled={status === 'pending'}
            onClick={(event) => {
              if (status === 'pending') {
                event.preventDefault();
                return;
              }
              onSubmit();
            }}
          >
            {status === 'pending' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Submit scores
          </button>
        </div>
      </div>
    </div>
  );
}
