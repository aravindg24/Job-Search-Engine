import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '../hooks/useSearch'
import { useResume } from '../hooks/useResume'
import SearchBar from '../components/search/SearchBar'
import ResultsGrid from '../components/search/ResultsGrid'
import Modal from '../components/shared/Modal'
import PitchGenerator from '../components/job/PitchGenerator'

export default function SearchPage() {
  const { results, loading, error, query, hasSearched, search } = useSearch()
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
        {/* Hero — shown before first search */}
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
        </div>
      </div>

      {/* ── Results area — widens to use full screen ── */}
      {hasSearched && (
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-12">
          {/* Results header */}
          {!loading && results.length > 0 && (
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>
                {results.length} matches
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
