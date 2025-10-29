import { useEffect, useMemo, useRef } from 'react';

import { cn } from '@/lib/utils';

interface BriefAnchorNavProps {
  sections: Array<{ id: string; label: string }>;
  activeSectionId?: string;
  onSelect: (id: string) => void;
}

export function BriefAnchorNav({ sections, activeSectionId, onSelect }: BriefAnchorNavProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeButtonRef = useRef<HTMLButtonElement | null>(null);

  const buttons = useMemo(
    () =>
      sections.map((section) => ({
        ...section,
        isActive: section.id === activeSectionId,
      })),
    [sections, activeSectionId]
  );

  useEffect(() => {
    if (!activeButtonRef.current || !containerRef.current) return;
    const button = activeButtonRef.current;
    const container = containerRef.current;

    const buttonRect = button.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    if (buttonRect.left < containerRect.left) {
      container.scrollTo({ left: container.scrollLeft - (containerRect.left - buttonRect.left) - 16, behavior: 'smooth' });
    } else if (buttonRect.right > containerRect.right) {
      container.scrollTo({ left: container.scrollLeft + (buttonRect.right - containerRect.right) + 16, behavior: 'smooth' });
    }
  }, [activeSectionId]);

  return (
    <div className="sticky top-20 z-30 relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-surface-base/95 to-transparent" />
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto rounded-xl border border-surface-border/60 bg-surface-base/80 p-2 backdrop-blur"
        role="navigation"
        aria-label="Brief sections"
      >
        {buttons.map(({ id, label, isActive }) => (
          <button
            key={id}
            ref={isActive ? activeButtonRef : null}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80',
              'border border-transparent',
              isActive
                ? 'bg-brand-500/20 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.45)]'
                : 'bg-surface-elevated/60 text-neutral-300 hover:text-white'
            )}
            aria-current={isActive ? 'true' : undefined}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
