import { type FormEvent, useId, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, ShieldAlert, UserPlus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

export type SignUpState = 'idle' | 'loading' | 'success' | 'error';

export interface EmailPasswordSignUpFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: (email: string, password: string, fullName?: string) => Promise<void>;
  status?: SignUpState;
  error?: string | null;
  successMessage?: string;
  showFullNameField?: boolean;
}

export function EmailPasswordSignUpForm({
  email,
  onEmailChange,
  onSubmit,
  status = 'idle',
  error,
  successMessage = 'Account created successfully!',
  showFullNameField = false,
}: EmailPasswordSignUpFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailFieldId = useId();
  const fullNameFieldId = useId();
  const passwordFieldId = useId();
  const confirmPasswordFieldId = useId();

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const isEmailValid = useMemo(() => {
    return /.+@.+\..+/.test(email.trim());
  }, [email]);

  const passwordsMatch = password === confirmPassword;
  const isPasswordValid = password.length >= 6;
  const hasEnteredConfirmPassword = confirmPassword.length > 0;

  const canSubmit =
    isEmailValid && isPasswordValid && passwordsMatch && !isLoading && (!showFullNameField || fullName.trim().length > 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    await onSubmit(email, password, showFullNameField ? fullName : undefined);
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

      {showFullNameField && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white" htmlFor={fullNameFieldId}>
            Full name
          </label>
          <input
            autoComplete="name"
            className="w-full rounded-lg border border-surface-border/60 bg-surface-base/70 px-3 py-2 text-sm text-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/80"
            id={fullNameFieldId}
            name="name"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Jane Smith"
            required
            type="text"
            value={fullName}
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-white" htmlFor={passwordFieldId}>
          Password
        </label>
        <div className="relative">
          <input
            autoComplete="new-password"
            className="w-full rounded-lg border border-surface-border/60 bg-surface-base/70 px-3 py-2 pr-10 text-sm text-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/80"
            id={passwordFieldId}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create a strong password"
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
        {password && <PasswordStrengthIndicator password={password} showRequirements />}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white" htmlFor={confirmPasswordFieldId}>
          Confirm password
        </label>
        <div className="relative">
          <input
            autoComplete="new-password"
            className={cn(
              'w-full rounded-lg border bg-surface-base/70 px-3 py-2 pr-10 text-sm text-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2',
              hasEnteredConfirmPassword && !passwordsMatch
                ? 'border-red-500/60 focus-visible:ring-red-400/80'
                : 'border-surface-border/60 focus-visible:ring-brand-400/80',
            )}
            id={confirmPasswordFieldId}
            name="password-confirm"
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            required
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
          />
          <button
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-neutral-400 hover:bg-surface-border/20 hover:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/80"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            type="button"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {hasEnteredConfirmPassword && !passwordsMatch && (
          <p className="text-xs text-red-400">Passwords do not match</p>
        )}
      </div>

      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:bg-brand-500/40"
        disabled={!canSubmit}
        type="submit"
      >
        {isLoading ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus aria-hidden="true" className="h-4 w-4" />
        )}
        Create account
      </button>

      <div aria-live="polite" className="min-h-[1.5rem] text-sm" role="status">
        {isSuccess && (
          <div className="flex items-center gap-2 text-emerald-300">
            <UserPlus aria-hidden="true" className="h-4 w-4" />
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
