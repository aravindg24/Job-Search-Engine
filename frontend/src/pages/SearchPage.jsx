import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSearch } from '../hooks/useSearch'
import { useResume } from '../hooks/useResume'
import ResultsGrid from '../components/search/ResultsGrid'
import Modal from '../components/shared/Modal'
import PitchGenerator from '../components/job/PitchGenerator'

function ClockIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

const STREAMS = [
  { id: null,          label: 'All' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'data',        label: 'Data' },
  { id: 'product',     label: 'Product' },
]

export default function SearchPage() {
  const { results, loading, error, query, hasSearched, recentQueries, search, reset, offset, total, loadMore } = useSearch()
  const { profile } = useResume()
  const [pitchJob, setPitchJob] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [activeStream, setActiveStream] = useState(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const didAutoSearch = useRef(false)

  const searchWithStream = (q, stream) => {
    const opts = stream ? { filters: { stream } } : {}
    search(q, opts)
  }

  // Auto-search when navigated here with ?q= param (from HomePage)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !didAutoSearch.current) {
      didAutoSearch.current = true
      setInputValue(q)
      searchWithStream(q, activeStream)
    }
  }, [searchParams, search])

  // Keep input in sync with active query
  useEffect(() => {
    if (query) setInputValue(query)
  }, [query])

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!inputValue.trim() || loading) return
    searchWithStream(inputValue.trim(), activeStream)
  }

  const handleStreamChange = (stream) => {
    setActiveStream(stream)
    if (query) searchWithStream(query, stream)
  }

  const handleRecent = (q) => {
    setInputValue(q)
    searchWithStream(q, activeStream)
  }

  const handleReset = () => {
    reset()
    setInputValue('')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Sticky compact search bar ── */}
      <div
        className="sticky top-0 z-10 px-6 py-4"
        style={{
          backgroundColor: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {/* Resume context dot */}
          {profile && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
              style={{
                backgroundColor: 'rgba(34,197,94,0.10)',
                color: '#16a34a',
                border: '1px solid rgba(34,197,94,0.20)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              {profile.parsed_profile?.name?.split(' ')[0] || 'Resume'}
            </span>
          )}

          {/* Single-line search input */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Describe the role you're looking for..."
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm transition-all duration-150"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--accent)'
                  e.target.style.boxShadow = '0 0 0 3px var(--accent-light)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {/* Clear button */}
              {inputValue && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-4)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-3)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
            >
              {loading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ── Stream tabs ── */}
      <div className="px-6 pt-3 pb-1" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-1">
          {STREAMS.map(s => (
            <button
              key={s.id ?? 'all'}
              onClick={() => handleStreamChange(s.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
              style={
                activeStream === s.id
                  ? { backgroundColor: 'var(--accent)', color: 'var(--bg)' }
                  : { color: 'var(--text-3)', backgroundColor: 'transparent' }
              }
              onMouseEnter={e => {
                if (activeStream !== s.id) e.currentTarget.style.backgroundColor = 'var(--surface)'
              }}
              onMouseLeave={e => {
                if (activeStream !== s.id) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-12">

        {/* ── Idle state: recent searches ── */}
        {!hasSearched && (
          <div className="max-w-3xl mx-auto">
            {recentQueries.length > 0 ? (
              <>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--text-4)' }}
                >
                  Recent searches
                </p>
                <div className="space-y-2">
                  {recentQueries.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecent(q)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 group"
                      style={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(232,255,71,0.3)'
                        e.currentTarget.style.backgroundColor = 'var(--surface-2)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.backgroundColor = 'var(--surface)'
                      }}
                    >
                      <span style={{ color: 'var(--text-4)' }}>
                        <ClockIcon />
                      </span>
                      <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-3)' }}>
                        {q}
                      </span>
                      <span
                        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        style={{ color: 'var(--accent)' }}
                      >
                        Search →
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-sm" style={{ color: 'var(--text-4)' }}>
                  No recent searches. Type above to get started.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Results ── */}
        {hasSearched && (
          <>
            {!loading && results.length > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>
                  {results.length} of {total} matches for{' '}
                  <span style={{ color: 'var(--text-3)' }}>"{query}"</span>
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xs font-medium transition-colors duration-150"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                >
                  Gap Analysis ↗
                </button>
              </div>
            )}

            <ResultsGrid
              results={results}
              loading={loading}
              error={error}
              query={query}
              onPitch={job => setPitchJob(job)}
            />

            {/* Load More button */}
            {!loading && results.length > 0 && results.length < total && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => {
                    if (!loading) {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.backgroundColor = 'var(--surface-2)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.backgroundColor = 'var(--surface)'
                  }}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pitch modal */}
      <Modal
        open={!!pitchJob}
        onClose={() => setPitchJob(null)}
        title={pitchJob ? `Pitch — ${pitchJob.title} at ${pitchJob.company}` : ''}
      >
        {pitchJob && <PitchGenerator jobId={pitchJob.id} />}
      </Modal>
    </div>
  )
}
