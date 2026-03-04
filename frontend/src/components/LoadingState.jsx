function SkeletonCard({ delay = 0 }) {
  return (
    <div
      className="bg-surface border border-border rounded-xl p-5 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-surface-2 rounded" />
          <div className="h-5 w-48 bg-surface-2 rounded" />
          <div className="h-3 w-36 bg-surface-2 rounded" />
        </div>
        <div className="h-5 w-24 bg-surface-2 rounded" />
      </div>
      <div className="h-12 bg-surface-2 rounded mb-3" />
      <div className="flex gap-2">
        {[60, 72, 56, 64].map((w, i) => (
          <div key={i} className="h-5 bg-surface-2 rounded" style={{ width: w }} />
        ))}
      </div>
    </div>
  )
}

export default function LoadingState() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-32 bg-surface rounded animate-pulse mb-4" />
      {[0, 100, 200, 250, 300].map(d => (
        <SkeletonCard key={d} delay={d} />
      ))}
    </div>
  )
}
