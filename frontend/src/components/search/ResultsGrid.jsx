import ResultCard from './ResultCard'
import { SkeletonCard } from './SkeletonCard'
import { EmptyState } from '../shared/EmptyState'

function SearchIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

export default function ResultsGrid({ results, loading, error, query, onPitch }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error) return (
    <EmptyState
      icon={<span className="text-red-400">✕</span>}
      title="Something went wrong"
      description={error}
    />
  )

  if (!results.length) return (
    <EmptyState
      icon={<SearchIcon />}
      title="No results found"
      description="Try different keywords, broaden your location, or remove filters."
    />
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {results.map((job, i) => (
        <ResultCard key={job.id} job={job} index={i} query={query} onPitch={onPitch} />
      ))}
    </div>
  )
}
