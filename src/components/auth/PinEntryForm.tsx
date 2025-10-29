import { type ChangeEvent, type FormEvent, useId } from 'react';
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { RequestState } from './EmailMagicLinkForm';

export interface PinEntryFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  pin: string;
  onPinChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  status?: RequestState;
  error?: string | null;
  helperText?: string;
  successMessage?: string;
}

export function PinEntryForm({
  email,
  onEmailChange,
  pin,
  onPinChange,
  onSubmit,
  status = 'idle',
  error,
  helperText = 'Enter the 6-digit PIN assigned by the event organizer. Pins expire nightly for security.',
  successMessage = 'PIN verified. You are ready to judge offline.',
}: PinEntryFormProps) {
  const emailFieldId = useId();
  const pinFieldId = useId();
  const statusRegionId = `${pinFieldId}-status`;

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isReady = email.trim().length > 0 && pin.length === 6;

  function handlePinChange(event: ChangeEvent<HTMLInputElement>) {
    const sanitized = event.target.value.replace(/\D/g, '').slice(0, 6);
    onPinChange(sanitized);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) {
      return;
    }

    await onSubmit();
  }

  return (
    <form
      aria-describedby={cn(statusRegionId, `${pinFieldId}-description`)}
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-white" htmlFor={emailFieldId}>
          Email address
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-lg border border-surface-border/60 bg-surface-base/70 px-3 py-2 text-sm text-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/80"
          id={emailFieldId}
          inputMode="email"
          name="pin-email"
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-neutral-300">
          <label className="font-medium text-white" htmlFor={pinFieldId}>
            Access PIN
          </label>
          <span className="font-mono text-xs text-neutral-400">6 digits</span>
        </div>
        <input
          aria-describedby={`${pinFieldId}-description`}
          autoComplete="one-time-code"
          className="w-full rounded-lg border border-surface-border/60 bg-surface-base/70 px-3 py-2 text-center text-lg tracking-[0.3em] text-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/80"
          id={pinFieldId}
          inputMode="numeric"
          name="pin"
          onChange={handlePinChange}
          pattern="\d{6}"
          placeholder="••••••"
          required
          value={pin}
        />
        <p className="text-xs text-neutral-300" id={`${pinFieldId}-description`}>
          {helperText}
        </p>
      </div>

      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-400/60 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!isReady || isLoading}
        type="submit"
      >
        {isLoading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <KeyRound aria-hidden="true" className="h-4 w-4" />}
        Verify PIN
      </button>

      <div aria-live="polite" className="min-h-[1.5rem] text-sm" id={statusRegionId} role="status">
        {isSuccess && (
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            <span>{successMessage}</span>
          </div>
        )}
        {isError && error && (
          <div className="flex items-center gap-2 text-amber-300">
            <ShieldAlert aria-hidden="true" className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </form>
  );
}
