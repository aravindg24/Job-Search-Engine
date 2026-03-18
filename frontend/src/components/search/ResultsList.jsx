import LoadingState from '../shared/LoadingState'
import ResultCard from './ResultCard'

export default function ResultsList({ results, loading, error, query, onPitch }) {
  if (loading) return <LoadingState count={4} />

  if (error) return (
    <div className="text-center py-12">
      <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
    </div>
  )

  if (!results.length) return null

  return (
    <div>
      <div className="space-y-3">
        {results.map((job, i) => (
          <ResultCard key={job.id} job={job} index={i} query={query} onPitch={onPitch} />
        ))}
      </div>
    </div>
  )
}
