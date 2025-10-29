export function ScoreSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-36 animate-pulse rounded-2xl bg-surface-elevated/40 ring-1 ring-inset ring-surface-border/30"
        />
      ))}
    </div>
  );
}

export function ScoreStickyBarSkeleton() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-surface-border/60 bg-surface-elevated/80 px-4 py-4">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
        <div className="h-6 w-48 animate-pulse rounded-full bg-surface-border/40" />
        <div className="flex w-full max-w-sm gap-3">
          <div className="h-10 flex-1 animate-pulse rounded-full bg-surface-border/40" />
          <div className="h-10 flex-1 animate-pulse rounded-full bg-surface-border/40" />
        </div>
      </div>
    </div>
  );
}
