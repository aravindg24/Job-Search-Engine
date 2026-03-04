import { useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import ResultsList from './components/ResultsList'
import JobDetail from './components/JobDetail'
import { useSearch } from './hooks/useSearch'

export default function App() {
  const { results, loading, error, query, hasSearched, search } = useSearch()
  const [selectedJob, setSelectedJob] = useState(null)

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />

      <main className="flex-1 px-4 pb-16">
        {/* Hero */}
        <div className="max-w-2xl mx-auto pt-16 pb-10 text-center">
          <h1 className="font-serif text-5xl sm:text-6xl text-text-primary leading-tight mb-4">
            Describe yourself.<br />
            <span className="text-gradient">Find your next role.</span>
          </h1>
          <p className="text-text-secondary text-base max-w-md mx-auto">
            A semantic job search engine that understands who you are — not just keywords.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto">
          <SearchBar onSearch={search} loading={loading} />
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="max-w-2xl mx-auto mt-8">
            <ResultsList
              results={results}
              loading={loading}
              error={error}
              query={query}
              onSelectJob={setSelectedJob}
            />
          </div>
        )}

        {/* Empty hero state */}
        {!hasSearched && (
          <div className="max-w-2xl mx-auto mt-12 text-center">
            <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">
              Powered by semantic search + LLM re-ranking
            </p>
            <div className="mt-6 flex justify-center gap-8 text-text-secondary text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Vector similarity
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-match-green" />
                AI re-ranking
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-match-yellow" />
                Match explanations
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Job detail panel */}
      {selectedJob && (
        <JobDetail
          job={selectedJob}
          query={query}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  )
}
