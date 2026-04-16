import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSavedJobs, unsaveJob } from '../utils/api'
import { toast } from '../components/shared/Toast'
import Pagination from '../components/search/Pagination'
import { formatDate } from '../utils/format'

const PAGE_SIZE = 10

export default function SavedJobsPage() {
  const navigate = useNavigate()
  const [allJobs, setAllJobs]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [removing, setRemoving]   = useState(null)

  const fetchSaved = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSavedJobs()
      setAllJobs(data.jobs || [])
    } catch {
      setError('Failed to load saved jobs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSaved() }, [fetchSaved])

  const totalPages = Math.ceil(allJobs.length / PAGE_SIZE)
  const pageJobs = allJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleUnsave = async (e, jobId) => {
    e.stopPropagation()
    setRemoving(jobId)
    try {
      await unsaveJob(jobId)
      setAllJobs(prev => prev.filter(j => j.id !== jobId))
      // Stay on current page unless it's now empty
      if (pageJobs.length === 1 && currentPage > 1) setCurrentPage(p => p - 1)
      toast('Removed from saved jobs')
    } catch {
      toast('Failed to remove job', 'error')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Saved Jobs</h1>
          {!loading && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
              {allJobs.length} job{allJobs.length !== 1 ? 's' : ''} saved
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/search')}
          className="text-xs px-4 py-2 rounded-lg transition-all"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)', fontWeight: 600 }}
        >
          Find More Jobs
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: 'var(--surface)' }} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-400 text-sm text-center py-12">{error}</p>}

      {/* Empty state */}
      {!loading && !error && allJobs.length === 0 && (
        <div className="text-center py-20">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--text-4)' }}>
              <path d="M5 3v18l7-3 7 3V3z" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-3)' }}>No saved jobs yet</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-4)' }}>
            Save jobs from search results or the dashboard to see them here.
          </p>
          <button
            onClick={() => navigate('/search')}
            className="text-xs px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)', fontWeight: 600 }}
          >
            Start searching
          </button>
        </div>
      )}

      {/* Job list */}
      {!loading && pageJobs.length > 0 && (
        <div className="space-y-3">
          {pageJobs.map(job => (
            <div
              key={job.id}
              onClick={() => navigate(`/job/${job.id}`, { state: { job } })}
              className="flex items-center gap-4 px-4 py-4 rounded-xl cursor-pointer transition-all group"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-4)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{job.title}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>
                  {job.company}
                  {job.location && <span style={{ color: 'var(--text-4)' }}> · {job.location}</span>}
                  {job.remote && (
                    <span
                      className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: 'rgba(232,255,71,0.12)', color: 'var(--accent)' }}
                    >
                      Remote
                    </span>
                  )}
                </p>
                <div className="flex gap-3 mt-1 text-xs" style={{ color: 'var(--text-4)' }}>
                  {job.salary_range && <span>{job.salary_range}</span>}
                  {job.posted_date && <span>Posted {formatDate(job.posted_date)}</span>}
                  {job.saved_at && <span>Saved {formatDate(job.saved_at)}</span>}
                </div>
              </div>

              {/* Unsave button */}
              <button
                onClick={e => handleUnsave(e, job.id)}
                disabled={removing === job.id}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all opacity-0 group-hover:opacity-100 disabled:opacity-40"
                style={{ border: '1px solid var(--border)', color: 'var(--text-3)', backgroundColor: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
                title="Remove from saved"
              >
                {removing === job.id ? '…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={p => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
      />
    </div>
  )
}
