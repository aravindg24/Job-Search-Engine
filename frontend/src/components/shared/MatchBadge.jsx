export default function MatchBadge({ score, size = 'md' }) {
  if (score == null) return null
  const s = Math.round(score)

  let color, bg, border
  if (s >= 85) {
    color = '#22C55E'; bg = 'rgba(34,197,94,0.10)'; border = 'rgba(34,197,94,0.22)'
  } else if (s >= 70) {
    color = '#FCAA2D'; bg = 'rgba(252,170,45,0.10)'; border = 'rgba(252,170,45,0.22)'
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
