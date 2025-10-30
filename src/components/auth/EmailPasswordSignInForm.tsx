import { type FormEvent, useId, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, LogIn, ShieldAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

export type SignInState = 'idle' | 'loading' | 'success' | 'error';

export interface EmailPasswordSignInFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: (email: string, password: string) => Promise<void>;
  status?: SignInState;
  error?: string | null;
  onForgotPassword?: () => void;
}

export function EmailPasswordSignInForm({
  email,
  onEmailChange,
  onSubmit,
  status = 'idle',
  error,
  onForgotPassword,
}: EmailPasswordSignInFormProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const emailFieldId = useId();
  const passwordFieldId = useId();

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const isEmailValid = useMemo(() => {
    return /.+@.+\..+/.test(email.trim());
  }, [email]);

  const canSubmit = isEmailValid && password.length > 0 && !isLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    await onSubmit(email, password);
  }

  return (
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white" htmlFor={passwordFieldId}>
            Password
          </label>
          {onForgotPassword && (
            <button
              className="text-xs text-brand-300 hover:text-brand-200 focus-visible:outline-none focus-visible:underline"
              onClick={onForgotPassword}
              type="button"
            >
              Forgot password?
            </button>
          )}
        </div>
        <div className="relative">
          <input
            autoComplete="current-password"
            className="w-full rounded-lg border border-surface-border/60 bg-surface-base/70 px-3 py-2 pr-10 text-sm text-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/80"
            id={passwordFieldId}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
            type={showPassword ? 'text' : 'password'}
            value={password}
          />
          <button
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-neutral-400 hover:bg-surface-border/20 hover:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/80"
            onClick={() => setShowPassword(!showPassword)}
            type="button"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:bg-brand-500/40"
        disabled={!canSubmit}
        type="submit"
      >
        {isLoading ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn aria-hidden="true" className="h-4 w-4" />
        )}
        Sign in
      </button>

      <div aria-live="polite" className="min-h-[1.5rem] text-sm" role="status">
        {isSuccess && (
          <div className="flex items-center gap-2 text-emerald-300">
            <LogIn aria-hidden="true" className="h-4 w-4" />
            <span>Sign in successful. Redirecting...</span>
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
