function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-5 animate-pulse"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 rounded-lg w-2/3" style={{ backgroundColor: 'var(--bg-3)' }} />
          <div className="h-3 rounded-lg w-1/3" style={{ backgroundColor: 'var(--bg-3)' }} />
        </div>
        <div className="h-6 w-12 rounded-lg" style={{ backgroundColor: 'var(--bg-3)' }} />
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-3 rounded-lg w-full" style={{ backgroundColor: 'var(--bg-3)' }} />
        <div className="h-3 rounded-lg w-5/6" style={{ backgroundColor: 'var(--bg-3)' }} />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-5 w-16 rounded-full" style={{ backgroundColor: 'var(--bg-3)' }} />
        <div className="h-5 w-20 rounded-full" style={{ backgroundColor: 'var(--bg-3)' }} />
        <div className="h-5 w-14 rounded-full" style={{ backgroundColor: 'var(--bg-3)' }} />
      </div>
    </div>
  )
}

export default function LoadingState({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
