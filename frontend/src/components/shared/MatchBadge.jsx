export default function MatchBadge({ score, size = 'md' }) {
  if (score == null) return null
  const s = Math.round(score)

  let color, bg, border
  if (s >= 80) {
    color = '#16a34a'; bg = 'rgba(34,197,94,0.10)'; border = 'rgba(34,197,94,0.22)'
  } else if (s >= 60) {
    color = '#b45309'; bg = 'rgba(245,158,11,0.10)'; border = 'rgba(245,158,11,0.22)'
  } else {
    color = 'var(--text-4)'; bg = 'var(--surface-2)'; border = 'var(--border)'
  }

  const sizeCls = size === 'lg'
    ? 'text-base px-3 py-1 font-bold'
    : 'text-xs px-2 py-0.5 font-semibold'

  return (
    <span
      className={`inline-flex items-center rounded-lg font-mono tabular-nums ${sizeCls}`}
      style={{ color, backgroundColor: bg, border: `1px solid ${border}` }}
    >
      {s}%
    </span>
  )
}
