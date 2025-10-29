import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useId, useMemo } from 'react';

import type { CommentStatus } from '@/hooks/useCommentFields';
import { cn } from '@/lib/utils';

export interface CommentFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  placeholder?: string;
  characterCount: number;
  maxLength: number;
  warningThreshold?: number;
  autosaveStatus?: CommentStatus;
  lastSavedAt?: Date | null;
  autosaveError?: string | null;
  validationMessage?: string | null;
  disabled?: boolean;
  readOnlyMessage?: string | null;
}

function formatAutosaveMessage(
  status: CommentStatus | undefined,
  lastSavedAt: Date | null | undefined,
  autosaveError: string | null | undefined,
) {
  switch (status) {
    case 'saving':
      return { copy: 'Saving draft…', tone: 'info', icon: Loader2 } as const;
    case 'saved': {
      const timeCopy = lastSavedAt
        ? `Draft saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Draft saved';
      return { copy: timeCopy, tone: 'success', icon: CheckCircle2 } as const;
    }
    case 'dirty':
      return { copy: 'Unsaved changes', tone: 'warning', icon: AlertCircle } as const;
    case 'error':
      return {
        copy: autosaveError ?? 'We could not save your note. We will retry in the background.',
        tone: 'danger',
        icon: AlertCircle,
      } as const;
    default:
      return null;
  }
}

export function CommentField({
  label,
  name,
  value,
  onChange,
  helperText,
  placeholder,
  characterCount,
  maxLength,
  warningThreshold = 140,
  autosaveStatus,
  lastSavedAt,
  autosaveError,
  validationMessage,
  disabled,
  readOnlyMessage,
}: CommentFieldProps) {
  const fieldId = useId();
  const helperId = `${fieldId}-helper`;
  const counterId = `${fieldId}-counter`;
  const statusId = `${fieldId}-status`;
  const errorId = `${fieldId}-error`;

  const counterTone = useMemo(() => {
    if (characterCount >= maxLength) {
      return 'danger';
    }
    if (characterCount > warningThreshold) {
      return 'warning';
    }
    return 'muted';
  }, [characterCount, maxLength, warningThreshold]);

  const autosaveMessage = formatAutosaveMessage(autosaveStatus, lastSavedAt ?? null, autosaveError ?? null);

  const describedBy = useMemo(() => {
    const ids = [helperText ? helperId : null, counterId];
    if (validationMessage) {
      ids.push(errorId);
    }
    if (autosaveMessage) {
      ids.push(statusId);
    }
    return ids.filter(Boolean).join(' ');
  }, [autosaveMessage, counterId, errorId, helperId, helperText, statusId, validationMessage]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-surface-border/70 bg-surface-base/80 p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-sm font-semibold text-white">
          {label}
        </label>
        {helperText ? <p id={helperId} className="text-sm text-neutral-300">{helperText}</p> : null}
        {readOnlyMessage && disabled ? (
          <p className="text-xs font-medium text-neutral-400" aria-live="polite">
            {readOnlyMessage}
          </p>
        ) : null}
      </div>
      <div className="relative">
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={Boolean(validationMessage || autosaveStatus === 'error')}
          maxLength={maxLength}
          rows={5}
          className={cn(
            'w-full rounded-2xl border border-transparent bg-neutral-900/60 px-4 py-3 text-sm text-neutral-100 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs">
          <span
            id={counterId}
            aria-live="polite"
            className={cn(
              'font-medium',
              counterTone === 'danger'
                ? 'text-red-300'
                : counterTone === 'warning'
                  ? 'text-amber-200'
                  : 'text-neutral-400',
            )}
          >
            {characterCount} / {maxLength}
          </span>
          {autosaveMessage ? (
            <span
              id={statusId}
              aria-live="polite"
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium',
                autosaveMessage.tone === 'danger'
                  ? 'bg-red-500/10 text-red-200'
                  : autosaveMessage.tone === 'warning'
                    ? 'bg-amber-500/10 text-amber-200'
                    : autosaveMessage.tone === 'success'
                      ? 'bg-emerald-500/10 text-emerald-200'
                      : 'bg-neutral-700/60 text-neutral-200',
              )}
            >
              {autosaveMessage.icon ? (
                <autosaveMessage.icon
                  className={cn(
                    'h-4 w-4',
                    autosaveStatus === 'saving' ? 'animate-spin' : undefined,
                  )}
                  aria-hidden="true"
                />
              ) : null}
              {autosaveMessage.copy}
            </span>
          ) : null}
        </div>
      </div>
      {validationMessage ? (
        <p id={errorId} className="text-sm font-medium text-red-300" role="alert">
          {validationMessage}
        </p>
      ) : null}
      {autosaveStatus === 'error' && autosaveError ? (
        <p className="text-sm text-red-200" role="alert">
          {autosaveError}
        </p>
      ) : null}
    </div>
  );
}
