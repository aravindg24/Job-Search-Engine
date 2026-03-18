import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDigest } from '../../hooks/useDigest'
import MatchBadge from '../shared/MatchBadge'
import { timeAgo } from '../../utils/format'

export default function DigestPanel() {
  const { digest, loading, refreshing, error, fetch, refresh } = useDigest()
  const navigate = useNavigate()

  useEffect(() => { fetch() }, [fetch])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          {digest && (
            <p className="text-xs text-secondary">
              {digest.new_matches > 0
                ? `${digest.new_matches} new match${digest.new_matches > 1 ? 'es' : ''}`
                : 'No new matches'}
              {digest.since && ` since ${timeAgo(digest.since)}`}
            </p>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="text-xs text-secondary hover:text-accent transition-colors border border-border hover:border-accent/30 rounded px-3 py-1.5"
        >
          {refreshing ? 'Refreshing…' : 'Check for more'}
        </button>
      </div>

      {loading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg" style={{ backgroundColor: 'var(--surface)' }} />)}
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && digest?.jobs?.length === 0 && (
        <p className="text-secondary text-sm text-center py-6">
          No matches yet. Set watch preferences on the Profile page.
        </p>
      )}

      {!loading && digest?.jobs?.length > 0 && (
        <div className="space-y-2">
          {digest.jobs.map(job => (
            <div
              key={job.id}
              onClick={() => navigate(`/job/${job.id}`, { state: { job: { ...job, match_score: job.match_score } } })}
              className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer transition-all"
              style={{ backgroundColor: 'var(--surface)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <MatchBadge score={job.match_score} />
              <div className="flex-1 min-w-0">
                <p className="text-primary text-sm font-medium truncate">{job.title}</p>
                <p className="text-secondary text-xs truncate">{job.company} · {job.source}</p>
              </div>
              {job.posted_date && (
                <span className="text-xs text-zinc-600 shrink-0">{timeAgo(job.posted_date)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
