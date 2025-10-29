import { useId, useMemo } from 'react';

import type { ScoringCriterion } from '@/types/scoring';

export type ScoreFieldStatus = 'pristine' | 'incomplete' | 'valid';

export interface ScoreSliderCardProps {
  criterion: ScoringCriterion;
  value?: number;
  status: ScoreFieldStatus;
  onChange: (value: number) => void;
  onFirstInteraction?: () => void;
}

export function ScoreSliderCard({ criterion, value, status, onChange, onFirstInteraction }: ScoreSliderCardProps) {
  const sliderId = useId();

  const displayValue = useMemo(() => {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof criterion.defaultValue === 'number') {
      return criterion.defaultValue;
    }

    return criterion.minScore ?? 1;
  }, [criterion.defaultValue, criterion.minScore, value]);

  const min = criterion.minScore ?? 1;
  const max = criterion.maxScore ?? 10;

  const ariaValueText = `${displayValue} out of ${max}`;

  const helperId = `${sliderId}-helper`;
  const errorId = `${sliderId}-error`;

  const showValidationMessage = status === 'incomplete';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-surface-border/70 bg-surface-base/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white" id={`${sliderId}-label`}>
            {criterion.label}
          </p>
          <p className="mt-1 text-sm text-neutral-300" id={helperId}>
            {criterion.helperText}
          </p>
        </div>
        <span
          className="min-w-[3rem] rounded-full bg-brand-500/10 px-3 py-1 text-center text-sm font-semibold text-brand-200"
          aria-live="polite"
        >
          {typeof value === 'number' ? value : '—'}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>{min}</span>
          <span>Tap and drag to score</span>
          <span>{max}</span>
        </div>
        <input
          type="range"
          id={sliderId}
          name={criterion.id}
          min={min}
          max={max}
          step={1}
          value={displayValue}
          aria-label={criterion.label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={displayValue}
          aria-valuetext={ariaValueText}
          aria-describedby={`${helperId}${showValidationMessage ? ` ${errorId}` : ''}`}
          className="h-10 w-full cursor-pointer appearance-none rounded-full bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          onChange={(event) => {
            const nextValue = Number.parseInt(event.target.value, 10);
            if (status === 'pristine') {
              onFirstInteraction?.();
            }
            onChange(nextValue);
          }}
        />
      </div>
      {showValidationMessage ? (
        <p id={errorId} className="text-sm font-medium text-red-300">
          Choose a score before submitting.
        </p>
      ) : null}
    </div>
  );
}
