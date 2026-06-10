import { useEffect, useState } from 'react'

function scoreColor(s) {
  if (s >= 85) return '#22C55E' // Success Green
  if (s >= 70) return '#FCAA2D' // Amber Gold
  return '#71717A'             // Neutral Gray
}

export default function ScoreArc({ score, size = 56 }) {
  const s = Math.round(score ?? 0)
  const r = (size / 2) - 5
  const circ = 2 * Math.PI * r
  const [offset, setOffset] = useState(circ)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handler = (e) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)

    if (mediaQuery.matches) {
      setOffset(circ - (s / 100) * circ)
    } else {
      const t = setTimeout(() => setOffset(circ - (s / 100) * circ), 120)
      return () => {
        clearTimeout(t)
        mediaQuery.removeEventListener('change', handler)
      }
    }
    return () => mediaQuery.removeEventListener('change', handler)
  }, [s, circ])

  const color = scoreColor(s)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--bg-3)" strokeWidth="3"
      />
      {/* Fill arc */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: reducedMotion ? 'none' : 'stroke-dashoffset 0.85s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />
      {/* Score label */}
      <text
        x={size / 2} y={size / 2 + 4}
        textAnchor="middle"
        fontSize={size >= 56 ? 13 : 10}
        fontWeight="700"
        fill={color}
        fontFamily="JetBrains Mono, monospace"
      >
        {s}
      </text>
    </svg>
  )
}
