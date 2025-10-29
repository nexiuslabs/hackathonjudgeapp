import { Play, RefreshCcw, Share2, Square, TimerReset } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { useMemo } from 'react';

import { TimerBadge } from '@/components/timer/TimerBadge';
import { cn } from '@/lib/utils';
import type { TimerPreset } from '@/types/timer';

import type { UseEventTimerResult } from '@/hooks/useEventTimer';
import type { UseTimerControlsResult } from '@/hooks/useTimerControls';

interface TimerControlPanelProps extends ComponentPropsWithoutRef<'section'> {
  timer: UseEventTimerResult;
  controls: UseTimerControlsResult;
  onOpenShare?: () => void;
}

function formatDuration(durationSeconds: number | null | undefined) {
  if (!durationSeconds || durationSeconds <= 0) {
    return '0:00';
  }

  const minutes = Math.floor(durationSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(durationSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function presetLabel(preset: TimerPreset | undefined | null) {
  if (!preset) {
    return 'Choose preset';
  }

  return `${preset.label} · ${formatDuration(preset.durationSeconds)}`;
}

export function TimerControlPanel({ timer, controls, onOpenShare, className, ...props }: TimerControlPanelProps) {
  const { snapshot, remainingMs, connectionState, isOffline, driftMs, lastSyncedAt, optimisticActionId } = timer;
  const phase = snapshot?.phase ?? 'idle';
  const isRunning = phase === 'running';
  const isPaused = phase === 'paused';
  const selectedPreset = useMemo(
    () => controls.presets.find((preset) => preset.id === controls.selectedPresetId) ?? null,
    [controls.presets, controls.selectedPresetId],
  );

  const startDisabled = Boolean(controls.pendingAction) || !selectedPreset;
  const pauseDisabled = Boolean(controls.pendingAction) || !isRunning;
  const resumeDisabled = Boolean(controls.pendingAction) || !isPaused;
  const resetDisabled = Boolean(controls.pendingAction) || (!isRunning && !isPaused && !optimisticActionId);

  return (
    <section
      {...props}
      className={cn(
        'rounded-3xl border border-surface-border/70 bg-surface-base/80 p-6 shadow-lg shadow-brand-900/10',
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <TimerBadge
            remainingMs={remainingMs}
            phase={phase}
            connectionState={connectionState}
            isOffline={isOffline}
            driftMs={driftMs}
            lastSyncedAt={lastSyncedAt}
            controlOwner={snapshot?.controlOwner ?? undefined}
            disabled
            className="cursor-default"
            size="lg"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">Preset</span>
              <select
                className="rounded-2xl border border-surface-border/70 bg-surface-muted/60 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                value={controls.selectedPresetId ?? ''}
                onChange={(event) => {
                  controls.setSelectedPresetId(event.target.value || null);
                }}
                disabled={controls.isLoadingPresets || Boolean(controls.pendingAction)}
              >
                <option value="" disabled>
                  {controls.isLoadingPresets ? 'Loading presets…' : 'Select duration'}
                </option>
                {controls.presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label} ({formatDuration(preset.durationSeconds)})
                  </option>
                ))}
              </select>
              {controls.presetError ? (
                <span className="text-xs text-amber-200">{controls.presetError.message}</span>
              ) : null}
            </label>
            <div className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">Status</span>
              <div className="rounded-2xl border border-surface-border/70 bg-surface-muted/60 px-3 py-3 text-sm text-white">
                <p className="font-semibold text-white/90">{phase === 'idle' ? 'Ready to start' : phase === 'running' ? 'Counting down' : phase === 'paused' ? 'Paused' : 'Completed'}</p>
                <p className="text-xs text-neutral-300">
                  {selectedPreset ? presetLabel(selectedPreset) : 'Choose a preset to begin'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4 lg:max-w-sm">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-400/50 bg-brand-500/20 px-4 py-3 text-sm font-semibold text-brand-100 transition hover:bg-brand-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                startDisabled && 'cursor-not-allowed opacity-60',
              )}
              disabled={startDisabled}
              onClick={() => {
                void controls.startTimer();
              }}
            >
              <Play className="h-4 w-4" aria-hidden="true" /> Start
            </button>
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/50 bg-amber-500/20 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                pauseDisabled && 'cursor-not-allowed opacity-60',
              )}
              disabled={pauseDisabled}
              onClick={() => {
                void controls.pauseTimer();
              }}
            >
              <Square className="h-4 w-4" aria-hidden="true" /> Pause
            </button>
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/50 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
                resumeDisabled && 'cursor-not-allowed opacity-60',
              )}
              disabled={resumeDisabled}
              onClick={() => {
                void controls.resumeTimer();
              }}
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" /> Resume
            </button>
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-2xl border border-surface-border/70 bg-surface-muted/60 px-4 py-3 text-sm font-semibold text-neutral-100 transition hover:bg-surface-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                resetDisabled && 'cursor-not-allowed opacity-60',
              )}
              disabled={resetDisabled}
              onClick={() => {
                void controls.resetTimer({ presetId: controls.selectedPresetId ?? undefined });
              }}
            >
              <TimerReset className="h-4 w-4" aria-hidden="true" /> Reset
            </button>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-400/50 bg-sky-500/20 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={() => {
              if (onOpenShare) {
                onOpenShare();
              } else {
                void controls.share.generate();
              }
            }}
            disabled={controls.share.isGenerating}
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            {controls.share.isGenerating ? 'Generating link…' : 'Share display'}
          </button>
          {controls.share.link ? (
            <div className="rounded-2xl border border-surface-border/70 bg-surface-muted/60 px-4 py-3 text-xs text-neutral-200">
              <p className="font-semibold text-white">Share link ready</p>
              <p className="truncate text-neutral-300">{controls.share.link.url}</p>
              <p className="text-[0.65rem] text-neutral-400">
                Expires {new Date(controls.share.link.expiresAt).toLocaleTimeString()} {controls.share.isFallback ? '(demo)' : ''}
              </p>
            </div>
          ) : null}
          {controls.actionError ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
              {controls.actionError.message}
            </div>
          ) : null}
          {timer.error ? (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
              {timer.error.message}
            </div>
          ) : null}
          {timer.isOffline ? (
            <div className="rounded-2xl border border-surface-border/60 bg-surface-muted/60 px-4 py-3 text-xs text-neutral-300">
              Working from cached timer data. Controls will queue until connectivity returns.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
