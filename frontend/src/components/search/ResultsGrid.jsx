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

  if (!results.length) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {results.map((job, i) => (
        <ResultCard key={job.id} job={job} index={i} query={query} onPitch={onPitch} />
      ))}
    </div>
  )
}
