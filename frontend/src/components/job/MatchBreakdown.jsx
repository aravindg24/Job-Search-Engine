import { useEffect, useState } from 'react'
import { explainMatch } from '../../utils/api'
import MatchBadge from '../shared/MatchBadge'
import EvalBlockCard from './EvalBlockCard'

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
      {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg" style={{ backgroundColor: 'var(--surface)' }} />)}
    </div>
  )

  if (!explain) return null

  return (
    <div className="space-y-5">
      {/* Score */}
      <div className="flex items-center gap-3">
        <MatchBadge score={explain.match_score} size="lg" />
        <div className="flex-1 rounded-full h-2" style={{ backgroundColor: 'var(--surface)' }}>
          <div
            className="h-2 rounded-full bg-accent transition-all duration-700"
            style={{ width: `${Math.min(explain.match_score, 100)}%` }}
          />
        </div>
      </div>

      {/* Strengths */}
      {explain.strengths?.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-secondary mb-2">Why you match</p>
          <ul className="space-y-2">
            {(Array.isArray(explain.strengths) ? explain.strengths : []).map((s, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                <span className="text-primary">{typeof s === 'string' ? s : `${s.area} — ${s.detail}`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {explain.gaps?.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-secondary mb-2">Gaps to address</p>
          <ul className="space-y-2">
            {(Array.isArray(explain.gaps) ? explain.gaps : []).map((g, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-yellow-500 shrink-0 mt-0.5">⚠</span>
                <span className="text-secondary">{typeof g === 'string' ? g : `${g.area} — ${g.detail}`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Advice */}
      {explain.suggestion && (
        <div className="border border-border rounded-xl p-4 text-sm text-secondary italic leading-relaxed" style={{ backgroundColor: 'var(--surface)' }}>
          {explain.suggestion}
        </div>
      )}

      {/* 6-block evaluation (F1) */}
      {explain.blocks?.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-secondary">Detailed Evaluation</p>
          {explain.blocks.map((b, i) => (
            <EvalBlockCard key={i} block={b} />
          ))}
        </div>
      )}
    </div>
  )
}
