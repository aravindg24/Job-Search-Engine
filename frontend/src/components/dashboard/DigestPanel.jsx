import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDigest } from '../../hooks/useDigest'
import { saveJob, unsaveJob } from '../../utils/api'
import { timeAgo } from '../../utils/format'

export default function DigestPanel() {
  const { digest, loading, refreshing, error, fetch, refresh } = useDigest()
  const [savingJobId, setSavingJobId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetch() }, [fetch])

  const handleSaveToggle = async (e, job) => {
    e.stopPropagation()
    setSavingJobId(job.id)
    try {
      if (job.job_is_saved) {
        await unsaveJob(job.id)
      } else {
        await saveJob(job.id)
      }
      // Refresh digest to get updated save status
      await fetch()
    } catch (err) {
      console.error('Failed to save/unsave job:', err)
    } finally {
      setSavingJobId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          {digest && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-secondary">
                {digest.new_matches > 0
                  ? `${digest.new_matches} new match${digest.new_matches > 1 ? 'es' : ''}`
                  : 'No new matches'}
                {digest.since && ` since ${timeAgo(digest.since)}`}
              </p>
              {digest.newly_indexed_count > 0 && (
                <p className="text-xs text-accent">
                  ({digest.newly_indexed_count} newly indexed, {digest.new_matches - digest.newly_indexed_count} top matches)
                </p>
              )}
            </div>
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
              onClick={() => navigate(`/job/${job.id}`, { state: { job } })}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer group card-row"
            >
              <div className="flex-1 min-w-0">
                <p className="text-primary text-sm font-medium truncate">{job.title}</p>
                <p className="text-secondary text-xs truncate">{job.company} · {job.source}</p>
              </div>
              {job.posted_date && (
                <span className="text-xs text-zinc-600 shrink-0">{timeAgo(job.posted_date)}</span>
              )}
              <button
                onClick={(e) => handleSaveToggle(e, job)}
                disabled={savingJobId === job.id}
                className="p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
                title={job.job_is_saved ? 'Unsave job' : 'Save job'}
              >
                {job.job_is_saved ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
                    <path d="M5 3v18l7-3 7 3V3z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--text-4)' }}>
                    <path d="M5 3v18l7-3 7 3V3z" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
