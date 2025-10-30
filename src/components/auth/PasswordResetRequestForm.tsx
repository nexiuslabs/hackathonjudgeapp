import { type FormEvent, useId, useMemo } from 'react';
import { Loader2, MailCheck, ShieldAlert } from 'lucide-react';

export type ResetRequestState = 'idle' | 'loading' | 'success' | 'error';

export interface PasswordResetRequestFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: (email: string) => Promise<void>;
  status?: ResetRequestState;
  error?: string | null;
  successMessage?: string;
  onBackToSignIn?: () => void;
}

export function PasswordResetRequestForm({
  email,
  onEmailChange,
  onSubmit,
  status = 'idle',
  error,
  successMessage = 'Check your email for password reset instructions.',
  onBackToSignIn,
}: PasswordResetRequestFormProps) {
  const emailFieldId = useId();

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const isEmailValid = useMemo(() => {
    return /.+@.+\..+/.test(email.trim());
  }, [email]);

  const canSubmit = isEmailValid && !isLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    await onSubmit(email);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold text-white">Reset your password</h3>
        <p className="text-sm text-neutral-300">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white" htmlFor={emailFieldId}>
            Email address
          </label>
          <input
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
        </div>

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:bg-brand-500/40"
          disabled={!canSubmit}
          type="submit"
        >
          {isLoading ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <MailCheck aria-hidden="true" className="h-4 w-4" />
          )}
          Send reset link
        </button>

        <div aria-live="polite" className="min-h-[1.5rem] text-sm" role="status">
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

      {onBackToSignIn && (
        <div className="text-center">
          <button
            className="text-sm text-brand-300 hover:text-brand-200 focus-visible:outline-none focus-visible:underline"
            onClick={onBackToSignIn}
            type="button"
          >
            Back to sign in
          </button>
        </div>
      )}
    </div>
  );
}
