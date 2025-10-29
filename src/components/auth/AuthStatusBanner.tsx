import { type ComponentType, type PropsWithChildren, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, WifiOff } from 'lucide-react';

import { cn } from '@/lib/utils';

export type AuthStatusVariant = 'info' | 'success' | 'warning' | 'offline';

const variantStyles: Record<AuthStatusVariant, string> = {
  info: 'bg-surface-highlight/60 text-neutral-100 border border-surface-border/60',
  success: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40',
  warning: 'bg-amber-500/15 text-amber-200 border border-amber-500/40',
  offline: 'bg-neutral-700/40 text-neutral-100 border border-neutral-500/60',
};

const iconMap: Record<AuthStatusVariant, ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  offline: WifiOff,
};

export interface AuthStatusBannerProps extends PropsWithChildren {
  variant?: AuthStatusVariant;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function AuthStatusBanner({
  variant = 'info',
  title,
  description,
  actions,
  children,
}: AuthStatusBannerProps) {
  const Icon = iconMap[variant];

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl p-4 text-sm shadow-inner shadow-black/10 sm:flex-row sm:items-center sm:justify-between',
        variantStyles[variant],
      )}
      role={variant === 'warning' || variant === 'offline' ? 'alert' : 'status'}
    >
      <div className="flex flex-1 items-start gap-3">
        <span className="mt-0.5 hidden text-base sm:block" aria-hidden="true">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <p className="font-medium leading-tight">{title}</p>
          {description ? <p className="text-sm/relaxed text-neutral-200">{description}</p> : null}
          {children}
        </div>
      </div>
      {actions ? <div className="flex flex-shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
