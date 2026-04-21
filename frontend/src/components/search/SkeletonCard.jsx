export function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="h-4 bg-[var(--bg-3)] rounded w-3/4" />
          <div className="h-3 bg-[var(--bg-3)] rounded w-1/2" />
        </div>
        <div className="h-6 w-14 bg-[var(--bg-3)] rounded-full flex-shrink-0" />
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-3 w-20 bg-[var(--bg-3)] rounded" />
        <div className="h-3 w-16 bg-[var(--bg-3)] rounded" />
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="h-3 bg-[var(--bg-3)] rounded w-full" />
        <div className="h-3 bg-[var(--bg-3)] rounded w-5/6" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-16 bg-[var(--bg-3)] rounded-full" />
        <div className="h-5 w-20 bg-[var(--bg-3)] rounded-full" />
        <div className="h-5 w-14 bg-[var(--bg-3)] rounded-full" />
      </div>
      <div className="h-px bg-[var(--border-2)] mb-3" />
      <div className="flex gap-2">
        <div className="h-7 w-14 bg-[var(--bg-3)] rounded-lg" />
        <div className="h-7 w-24 bg-[var(--bg-3)] rounded-lg" />
      </div>
    </div>
  )
}
