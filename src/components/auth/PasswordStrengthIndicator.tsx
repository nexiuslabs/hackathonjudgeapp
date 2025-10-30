import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
}

export interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'No password',
      color: 'bg-neutral-600',
      suggestions: ['Enter a password to see strength'],
    };
  }

  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    suggestions.push('Use at least 8 characters');
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Mix uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Include at least one number');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Add a special character (!@#$%^&*)');
  }

  let label = 'Weak';
  let color = 'bg-red-500';

  if (score >= 5) {
    label = 'Strong';
    color = 'bg-emerald-500';
  } else if (score >= 3) {
    label = 'Good';
    color = 'bg-amber-400';
  } else if (score >= 1) {
    label = 'Fair';
    color = 'bg-orange-500';
  }

  return {
    score,
    label,
    color,
    suggestions: suggestions.slice(0, 2),
  };
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = false,
  className,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  const requirements = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

    return [
      { label: 'At least 8 characters', met: hasMinLength },
      { label: 'Uppercase & lowercase letters', met: hasUpperAndLower },
      { label: 'At least one number', met: hasNumber },
      { label: 'At least one special character', met: hasSpecialChar },
    ];
  }, [password]);

  if (!password && !showRequirements) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {password && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300">Password strength</span>
            <span className={cn('font-medium', strength.score >= 3 ? 'text-emerald-300' : 'text-amber-300')}>
              {strength.label}
            </span>
          </div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all',
                  index < strength.score ? strength.color : 'bg-neutral-700',
                )}
              />
            ))}
          </div>
          {strength.suggestions.length > 0 && (
            <ul className="space-y-0.5 text-xs text-neutral-400">
              {strength.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showRequirements && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-neutral-300">Password requirements</p>
          <ul className="space-y-1">
            {requirements.map((req) => (
              <li key={req.label} className="flex items-center gap-2 text-xs">
                {req.met ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                ) : (
                  <X className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                )}
                <span className={cn(req.met ? 'text-emerald-300' : 'text-neutral-400')}>{req.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
