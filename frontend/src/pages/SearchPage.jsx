import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '../hooks/useSearch'
import { useResume } from '../hooks/useResume'
import SearchBar from '../components/search/SearchBar'
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

export default function SearchPage() {
  const { results, loading, error, query, hasSearched, recentQueries, search, reset } = useSearch()
  const { profile } = useResume()
  const [pitchJob, setPitchJob] = useState(null)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Sticky top search area ── */}
      <div
        className="sticky top-0 z-10 pt-8 pb-5 px-6"
        style={{
          backgroundColor: 'var(--bg)',
          borderBottom: hasSearched ? '1px solid var(--border)' : 'none',
        }}
      >
        {/* Hero — only before first search */}
        {!hasSearched && (
          <div className="text-center mb-8 animate-fade-in">
            <p
              className="text-xs font-mono font-medium tracking-widest uppercase mb-5"
              style={{ color: 'var(--accent)' }}
            >
              AI Job Search
            </p>
            <h1
              className="text-4xl leading-tight mb-3"
              style={{
                fontFamily: '"Instrument Serif", Georgia, serif',
                color: 'var(--text)',
                letterSpacing: '-0.01em',
              }}
            >
              Describe yourself.<br />
              <span style={{ color: 'var(--accent)' }}>Find your next role.</span>
            </h1>
            <p className="text-base leading-relaxed max-w-md mx-auto" style={{ color: 'var(--text-3)' }}>
              Semantic search that understands who you are — not just what you type.
            </p>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <SearchBar onSearch={search} loading={loading} resumeProfile={profile} />

          {/* ── Recent searches — shown only on the idle/fresh state ── */}
          {!hasSearched && recentQueries.length > 0 && (
            <div className="mt-5">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2.5"
                style={{ color: 'var(--text-4)' }}
              >
                Recent searches
              </p>
              <div className="space-y-1.5">
                {recentQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => search(q)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-150 group"
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
                    <span
                      className="flex-1 text-sm truncate"
                      style={{ color: 'var(--text-3)' }}
                    >
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
            </div>
          )}

          {/* New Search button — shown while results are visible */}
          {hasSearched && !loading && (
            <div className="flex justify-end mt-3">
              <button
                onClick={reset}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150"
                style={{
                  color: 'var(--text-3)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--accent)'
                  e.currentTarget.style.borderColor = 'rgba(232,255,71,0.3)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-3)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
              >
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" />
                </svg>
                New search
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Results area ── */}
      {hasSearched && (
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-12">
          {!loading && results.length > 0 && (
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>
                {results.length} matches for <span style={{ color: 'var(--text-3)' }}>"{query}"</span>
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
        </div>
      )}

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
