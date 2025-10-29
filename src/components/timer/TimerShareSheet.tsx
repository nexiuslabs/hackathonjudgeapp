import { Copy, ExternalLink, X } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { useCallback, useState } from 'react';

import { cn } from '@/lib/utils';
import type { TimerShareLink } from '@/types/timer';

interface TimerShareSheetProps extends ComponentPropsWithoutRef<'div'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareLink: TimerShareLink | null;
  isGenerating: boolean;
  isFallback: boolean;
  error: Error | null;
  onGenerate: () => Promise<void>;
}

export function TimerShareSheet({
  open,
  onOpenChange,
  shareLink,
  isGenerating,
  isFallback,
  error,
  onGenerate,
  className,
  ...props
}: TimerShareSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!shareLink) {
      return;
    }

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }

      await navigator.clipboard.writeText(shareLink.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      console.warn('Failed to copy timer link', copyError);
      setCopied(false);
    }
  }, [shareLink]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur',
        className,
      )}
      {...props}
    >
      <div className="w-full max-w-lg rounded-3xl border border-surface-border/70 bg-surface-base/95 p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Share the finals timer</h2>
            <p className="text-sm text-neutral-300">
              Scan the QR code or copy the link below to project the synchronized countdown on external displays.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-surface-border/60 bg-surface-muted/60 p-1.5 text-neutral-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Close share sheet</span>
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border/70 bg-surface-muted/60 px-6 py-8 text-center text-sm text-neutral-400">
            <span className="text-xs uppercase tracking-[0.28em] text-neutral-500">QR Preview</span>
            <span className="mt-3 text-xs text-neutral-300">
              Render QR codes via production build. Fallback shows link preview only.
            </span>
            {shareLink ? (
              <a
                href={shareLink.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-surface-border/70 px-3 py-1 text-xs text-neutral-200 transition hover:border-brand-400/70 hover:text-brand-100"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Open preview
              </a>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <div className="rounded-2xl border border-surface-border/70 bg-surface-muted/60 px-4 py-3 text-xs text-neutral-200">
              {shareLink ? (
                <>
                  <p className="text-sm font-semibold text-white">Timer link</p>
                  <p className="truncate text-neutral-200">{shareLink.url}</p>
                  <p className="text-[0.65rem] text-neutral-400">
                    Expires {new Date(shareLink.expiresAt).toLocaleTimeString()} {isFallback ? '(demo)' : ''}
                  </p>
                </>
              ) : (
                <p className="text-neutral-300">Generate a share link to enable the external display.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-full border border-brand-400/50 bg-brand-500/20 px-4 py-2 text-sm font-semibold text-brand-100 transition hover:bg-brand-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  isGenerating && 'cursor-wait opacity-60',
                )}
                onClick={() => {
                  void onGenerate();
                }}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating…' : 'Generate link'}
              </button>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-full border border-surface-border/60 px-4 py-2 text-sm font-semibold text-neutral-100 transition hover:border-brand-400/60 hover:text-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  (!shareLink || isGenerating) && 'cursor-not-allowed opacity-60',
                )}
                onClick={() => {
                  void handleCopy();
                }}
                disabled={!shareLink || isGenerating}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
            {error ? (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                {error.message}
              </div>
            ) : null}
            {isFallback ? (
              <p className="text-[0.7rem] text-neutral-400">
                Demo tokens refresh every 30 minutes. Use the full Supabase backend to issue signed links for production.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
