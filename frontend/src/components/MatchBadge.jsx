export default function MatchBadge({ score }) {
  const pct = Math.round(score ?? 0)

  let color, dot
  if (pct >= 80) {
    color = 'text-match-green'
    dot = 'bg-match-green'
  } else if (pct >= 60) {
    color = 'text-match-yellow'
    dot = 'bg-match-yellow'
  } else {
    color = 'text-match-red'
    dot = 'bg-match-red'
  }

  return (
    <div className={`flex items-center gap-1.5 font-mono text-sm font-medium ${color}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {pct}% match
    </div>
  )
}
