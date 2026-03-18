import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '../hooks/useSearch'
import { useResume } from '../hooks/useResume'
import SearchBar from '../components/search/SearchBar'
import ResultsList from '../components/search/ResultsList'
import Modal from '../components/shared/Modal'
import PitchGenerator from '../components/job/PitchGenerator'

export default function SearchPage() {
  const { results, loading, error, query, hasSearched, search } = useSearch()
  const { profile } = useResume()
  const [pitchJob, setPitchJob] = useState(null)
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">

      {/* Hero — shown before first search */}
      {!hasSearched && (
        <div className="text-center mb-12 animate-fade-in">
          <p
            className="text-xs font-mono font-medium tracking-widest uppercase mb-5"
            style={{ color: 'var(--accent)' }}
          >
            AI Job Search
          </p>
          <h1
            className="text-4xl leading-tight mb-4"
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

      <SearchBar onSearch={search} loading={loading} resumeProfile={profile} />

      {/* Results header */}
      {hasSearched && !loading && results.length > 0 && (
        <div className="flex items-center gap-3 mt-10 mb-5">
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

      {hasSearched && (
        <ResultsList
          results={results}
          loading={loading}
          error={error}
          query={query}
          onPitch={job => setPitchJob(job)}
        />
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
