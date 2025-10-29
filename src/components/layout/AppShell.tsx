import { type PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ClipboardCheck,
  Gauge,
  ShieldCheck,
} from 'lucide-react';

import { appMetadata } from '@/config/app-metadata';
import { buildInfo } from '@/lib/build-info';
import { cn } from '@/lib/utils';

import { SafeAreaContainer } from './SafeAreaContainer';

const navItems = [
  {
    to: '/brief',
    label: 'Brief',
    description: 'Event goals',
    icon: ClipboardCheck,
  },
  {
    to: '/score',
    label: 'Score',
    description: 'Judge queue',
    icon: Gauge,
  },
  {
    to: '/admin',
    label: 'Admin',
    description: 'Operations',
    icon: ShieldCheck,
  },
] as const;

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-surface-muted text-neutral-100 flex flex-col">
      <header className="border-b border-surface-border/60 bg-surface-base/90 backdrop-blur">
        <SafeAreaContainer
          className="flex items-center justify-between gap-4 py-4"
          insets={['top', 'inline']}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/20 text-brand-200 ring-1 ring-brand-500/40">
              HJ
            </div>
            <div className="space-y-0.5">
              <p className="text-base font-semibold tracking-tight">
                {appMetadata.name}
              </p>
              <p className="text-sm text-neutral-300">
                Trusted guidance for every judging decision
              </p>
            </div>
          </div>
          <div className="hidden text-right text-xs text-neutral-400 sm:block">
            <p className="font-medium text-neutral-300">Build</p>
            <p className="font-mono text-[0.65rem] uppercase tracking-wide">
              {buildInfo.version}
            </p>
          </div>
        </SafeAreaContainer>
      </header>
      <main className="flex-1">
        <SafeAreaContainer as="div" className="py-8" insets={['inline']}>
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            {children}
          </div>
        </SafeAreaContainer>
      </main>
      <nav className="border-t border-surface-border/60 bg-surface-base/90 backdrop-blur">
        <SafeAreaContainer
          as="div"
          className="flex items-center justify-between gap-1 py-2 text-sm"
          insets={['bottom', 'inline']}
        >
          {navItems.map(({ icon: Icon, label, to, description }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex-1 rounded-lg px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/80',
                  'text-neutral-300 hover:text-white focus-visible:bg-brand-500/10',
                  isActive
                    ? 'bg-brand-500/15 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.35)]'
                    : 'bg-surface-elevated/60'
                )
              }
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-highlight/60 text-brand-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col text-left">
                  <span className="font-medium leading-tight">{label}</span>
                  <span className="text-xs text-neutral-400">{description}</span>
                </div>
              </div>
            </NavLink>
          ))}
        </SafeAreaContainer>
      </nav>
    </div>
  );
}
