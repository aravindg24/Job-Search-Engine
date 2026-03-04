import ResultCard from './ResultCard'
import LoadingState from './LoadingState'

export default function ResultsList({ results, loading, error, query, onSelectJob }) {
  if (loading) return <LoadingState />

  if (error) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center animate-fade-in">
        <p className="text-match-red font-medium mb-1">Search failed</p>
        <p className="text-text-secondary text-sm">{error}</p>
      </div>
    )
  }

  if (!results.length) return null

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-text-secondary text-sm font-mono shrink-0">
          {results.length} matches found
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-3">
        {results.map((job, i) => (
          <ResultCard key={job.id} job={job} index={i} onSelect={onSelectJob} />
        ))}
      </div>
    </div>
  )
}
