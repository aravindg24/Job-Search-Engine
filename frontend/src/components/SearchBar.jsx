import { useState, useRef } from 'react'

const EXAMPLES = [
  "ML engineer with PyTorch experience, looking for remote AI research roles",
  "New grad, React + Node.js, Bay Area startup, interested in developer tools",
  "Data engineer with Spark and dbt, fintech or AI infrastructure focus",
  "Full-stack engineer 3 years React + Python, excited about LLMs and search",
]

export default function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (value.trim() && !loading) {
      onSearch(value.trim())
    }
  }

  function handleExample(ex) {
    setValue(ex)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-xl border border-border bg-surface focus-within:border-accent/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe yourself — your skills, experience, what you're looking for..."
            className="w-full bg-transparent text-text-primary placeholder:text-text-secondary resize-none rounded-xl px-4 pt-4 pb-12 text-base outline-none leading-relaxed"
            rows={3}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-text-secondary text-xs hidden sm:block">⌘↵ to search</span>
            <button
              type="submit"
              disabled={!value.trim() || loading}
              className="flex items-center gap-2 bg-accent text-bg font-semibold text-sm px-4 py-2 rounded-lg hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              )}
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-text-secondary text-xs mt-0.5">Try:</span>
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => handleExample(ex)}
            className="text-xs text-text-secondary hover:text-text-primary border border-border hover:border-accent/30 px-2.5 py-1 rounded-full transition-colors text-left"
          >
            "{ex.length > 50 ? ex.slice(0, 50) + '…' : ex}"
          </button>
        ))}
      </div>
    </div>
  )
}
