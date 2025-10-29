import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = {
  default:
    'inline-flex items-center rounded-full border border-transparent bg-brand-500/20 px-2.5 py-0.5 text-xs font-medium tracking-wide text-brand-100',
  outline:
    'inline-flex items-center rounded-full border border-surface-border/60 bg-transparent px-2.5 py-0.5 text-xs font-medium tracking-wide text-neutral-200',
  success:
    'inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium tracking-wide text-emerald-200',
  warning:
    'inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium tracking-wide text-amber-200',
  danger:
    'inline-flex items-center rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium tracking-wide text-rose-200',
} satisfies Record<string, string>;

export type BadgeVariant = keyof typeof badgeVariants;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants[variant] ?? badgeVariants.default, className)} {...props} />
  ),
);

Badge.displayName = 'Badge';
