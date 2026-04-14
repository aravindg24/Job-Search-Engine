function scoreColor(score) {
  if (score >= 75) return '#4ade80'   // green
  if (score >= 50) return '#facc15'   // yellow
  return '#f87171'                     // red
}

export default function EvalBlockCard({ block }) {
  const color = scoreColor(block.score)

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Header: title + score */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
          {block.title}
        </span>
        <span className="text-sm font-bold font-mono" style={{ color }}>
          {block.score}
        </span>
      </div>

      {/* Score bar */}
      <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--bg)' }}>
        <div
          className="h-1 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(block.score, 100)}%`, backgroundColor: color }}
        />
      </div>

      {/* Bullet items */}
      {block.items?.length > 0 && (
        <ul className="space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
              <span className="shrink-0 mt-0.5" style={{ color }}>·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Summary */}
      {block.summary && (
        <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-4)' }}>
          {block.summary}
        </p>
      )}
    </div>
  )
}
