import LoadingState from '../shared/LoadingState'
import ResultCard from './ResultCard'

export default function ResultsGrid({ results, loading, error, query, onPitch }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-52 rounded-xl animate-pulse"
            style={{ backgroundColor: 'var(--surface)' }}
          />
        ))}
      </div>
    )
  }

  if (error) return (
    <div className="text-center py-12">
      <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
    </div>
  )

  if (!results.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--text-4)' }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-3)' }}>No results found</p>
      <p className="text-xs max-w-xs" style={{ color: 'var(--text-4)' }}>
        Try different keywords, broaden your location, or remove filters.
      </p>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {results.map((job, i) => (
        <ResultCard key={job.id} job={job} index={i} query={query} onPitch={onPitch} />
      ))}
    </div>
  )
}
