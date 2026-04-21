import { useEffect, useState } from 'react'
import { explainMatch } from '../../utils/api'
import MatchBadge from '../shared/MatchBadge'

function AnimatedBar({ value, color }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(value, 100)), 100)
    return () => clearTimeout(t)
  }, [value])

  return (
    <div className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--surface)]">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  )
}

function scoreColor(score) {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#F59E0B'
  return '#71717A'
}

export default function MatchBreakdown({ job, query }) {
  const [explain, setExplain] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!job?.id) return
    const effectiveQuery = query || `${job.title} at ${job.company}. ${(job.description || '').slice(0, 200)}`
    setLoading(true)
    explainMatch({ query: effectiveQuery, job_id: job.id })
      .then(setExplain)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [job?.id, query])

  if (loading) return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-10 rounded-lg bg-[var(--surface)]" />
      ))}
    </div>
  )

  if (!explain) return null

  return (
    <div className="space-y-5">
      {/* Score row */}
      <div className="flex items-center gap-3">
        <MatchBadge score={explain.match_score} size="lg" />
        <AnimatedBar value={explain.match_score} color={scoreColor(explain.match_score)} />
        <span className="text-xs font-mono text-[var(--text-4)] shrink-0">
          {explain.match_score}%
        </span>
      </div>

      {/* Strengths */}
      {explain.strengths?.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-4)] mb-2">Why you match</p>
          <ul className="space-y-2">
            {(Array.isArray(explain.strengths) ? explain.strengths : []).map((s, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                <span className="text-[var(--text)]">
                  {typeof s === 'string' ? s : `${s.area} — ${s.detail}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {explain.gaps?.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-4)] mb-2">Gaps to address</p>
          <ul className="space-y-2">
            {(Array.isArray(explain.gaps) ? explain.gaps : []).map((g, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-yellow-500 shrink-0 mt-0.5">⚠</span>
                <span className="text-[var(--text-2)]">
                  {typeof g === 'string' ? g : `${g.area} — ${g.detail}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Advice */}
      {explain.suggestion && (
        <div
          className="rounded-xl p-4 text-sm text-[var(--text-3)] italic leading-relaxed border border-[var(--border)]"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          {explain.suggestion}
        </div>
      )}
    </div>
  )
}
