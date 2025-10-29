import { Loader2, X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';

import { cn } from '@/lib/utils';

export interface UnlockRequestSheetProps {
  open: boolean;
  note: string;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

export function UnlockRequestSheet({
  open,
  note,
  onNoteChange,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: UnlockRequestSheetProps) {
  const headingId = useId();
  const descriptionId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      className="fixed inset-0 z-40 flex items-end justify-center bg-neutral-950/60 px-4 pb-8 pt-12 backdrop-blur"
    >
      <div className="w-full max-w-2xl rounded-3xl border border-surface-border/60 bg-surface-elevated/95 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 id={headingId} className="text-lg font-semibold text-white">
              Request ballot unlock
            </h2>
            <p id={descriptionId} className="text-sm text-neutral-300">
              Need to adjust a score or comment? Let operations know why and they will unlock your ballot once ready.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-surface-border/70 p-2 text-neutral-300 transition hover:border-brand-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <span className="sr-only">Close unlock request form</span>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <label htmlFor={`${headingId}-note`} className="text-sm font-medium text-white">
            Optional note for operations
          </label>
          <textarea
            id={`${headingId}-note`}
            ref={textareaRef}
            rows={4}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            className="w-full rounded-2xl border border-surface-border/70 bg-neutral-900/70 px-4 py-3 text-sm text-neutral-100 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            placeholder="Example: Need to correct the technical depth slider after clarifying the scope."
          />
          <p className="text-xs text-neutral-400">
            Notes are optional but help operations understand what to double-check before releasing your ballot.
          </p>
          {errorMessage ? (
            <p className="text-sm text-red-300" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border border-surface-border/70 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-brand-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:w-auto"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => {
              void onSubmit();
            }}
            disabled={isSubmitting}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-neutral-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated/95 sm:w-auto',
              isSubmitting && 'opacity-70',
            )}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Send unlock request
          </button>
        </div>
      </div>
    </div>
  );
}
