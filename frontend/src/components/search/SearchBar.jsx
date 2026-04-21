import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const EXAMPLES = [
  'remote AI startups with search focus',
  'Bay Area fintech, Series A–B',
  'full-stack with LLM work, no strict exp req',
  'ML infrastructure / MLOps roles',
]

export default function SearchBar({ onSearch, loading, resumeProfile }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const ref = useRef(null)

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!query.trim() || loading) return
    onSearch(query.trim())
  }

  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Resume context pill */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        {resumeProfile ? (
          <>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: 'rgba(34,197,94,0.10)',
                color: '#16a34a',
                border: '1px solid rgba(34,197,94,0.20)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              {resumeProfile.parsed_profile?.name || 'Resume loaded'}
            </span>
            <span style={{ color: 'var(--text-4)' }} className="text-xs">
              Search is context-aware
            </span>
            <button
              onClick={() => navigate('/profile')}
              className="ml-auto text-xs link-accent"
            >
              Edit profile →
            </button>
          </>
        ) : (
          <>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text-3)',
                border: '1px solid var(--border)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'var(--text-4)' }} />
              No resume
            </span>
            <button
              onClick={() => navigate('/profile')}
              className="text-xs font-medium transition-colors duration-150"
              style={{ color: 'var(--accent)' }}
            >
              Upload yours →
            </button>
            <span style={{ color: 'var(--text-4)' }} className="text-xs">for personalized results</span>
          </>
        )}
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={ref}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Describe the role you're looking for..."
          rows={3}
          className="w-full rounded-xl px-4 py-3.5 pr-28 text-sm resize-none transition-all duration-150"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            outline: 'none',
            boxShadow: '0 1px 3px var(--shadow)',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--accent)'
            e.target.style.boxShadow = '0 0 0 3px var(--accent-light)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--border)'
            e.target.style.boxShadow = '0 1px 3px var(--shadow)'
          }}
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--bg)',
          }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {loading ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
          Search
        </button>
      </form>

      {/* Example chips */}
      <div className="flex flex-wrap gap-2 mt-3">
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            onClick={() => { setQuery(ex); ref.current?.focus() }}
            className="text-xs px-3 py-1.5 rounded-full chip"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
