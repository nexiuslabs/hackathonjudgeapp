import { type FormEvent, useId, useMemo } from 'react';
import { Loader2, MailCheck, ShieldAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

export type RequestState = 'idle' | 'loading' | 'success' | 'error';

export interface EmailMagicLinkFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  onRequest: () => Promise<void>;
  status?: RequestState;
  error?: string | null;
  helperText?: string;
  successMessage?: string;
}

export function EmailMagicLinkForm({
  email,
  onEmailChange,
  onRequest,
  status = 'idle',
  error,
  helperText = 'We will email a single-use link that grants access to the judging tools.',
  successMessage = 'Check your inbox for the secure link.',
}: EmailMagicLinkFormProps) {
  const emailFieldId = useId();
  const helpTextId = useId();

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const isEmailValid = useMemo(() => {
    return /.+@.+\..+/.test(email.trim());
  }, [email]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) {
      return;
    }

    await onRequest();
  }

  return (
    <form
      aria-describedby={cn(helpTextId, isSuccess || isError ? `${emailFieldId}-status` : undefined)}
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-white" htmlFor={emailFieldId}>
          Email address
        </label>
        <input
          aria-describedby={helpTextId}
          autoComplete="email"
          className="w-full rounded-lg border border-surface-border/60 bg-surface-base/70 px-3 py-2 text-sm text-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/80"
          id={emailFieldId}
          inputMode="email"
          name="email"
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <p className="text-xs text-neutral-300" id={helpTextId}>
          {helperText}
        </p>
      </div>

      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:bg-brand-500/40"
        disabled={!isEmailValid || isLoading}
        type="submit"
      >
        {isLoading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <MailCheck aria-hidden="true" className="h-4 w-4" />}
        Send magic link
      </button>

      <div aria-live="polite" className="min-h-[1.5rem] text-sm" id={`${emailFieldId}-status`} role="status">
        {isSuccess && (
          <div className="flex items-center gap-2 text-emerald-300">
            <MailCheck aria-hidden="true" className="h-4 w-4" />
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
