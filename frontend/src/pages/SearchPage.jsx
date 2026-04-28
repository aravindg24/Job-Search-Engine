import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSearch } from '../hooks/useSearch'
import { useResume } from '../hooks/useResume'
import ResultsGrid from '../components/search/ResultsGrid'
import Pagination from '../components/search/Pagination'
import Modal from '../components/shared/Modal'
import PitchGenerator from '../components/job/PitchGenerator'

function ClockIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export default function SearchPage() {
  const { results, loading, error, query, hasSearched, recentQueries, search, reset, currentPage, total, totalPages, goToPage, sortBy, changeSortBy } = useSearch()
  const { profile } = useResume()
  const [pitchJob, setPitchJob] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({
    location: '',
    remote: 'any',
    experience_level: '',
    role_type: '',
    company_stages: '',
    salary_min: '',
    salary_max: '',
    excludes: '',
  })
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const didAutoSearch = useRef(false)
  const didRestoreScroll = useRef(false)
  const SCROLL_KEY = 'direct_scroll_y'

  // Save scroll position when leaving the page (e.g. opening a job detail)
  useEffect(() => {
    return () => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
    }
  }, [])

  // Restore scroll position after results render on back-navigation
  useEffect(() => {
    if (results.length > 0 && !didRestoreScroll.current) {
      const saved = sessionStorage.getItem(SCROLL_KEY)
      if (saved !== null) {
        didRestoreScroll.current = true
        sessionStorage.removeItem(SCROLL_KEY)
        requestAnimationFrame(() => {
          window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' })
        })
      }
    }
  }, [results])

  const buildFiltersPayload = () => {
    const payload = {}
    if (filters.location.trim()) payload.location = filters.location.trim()
    if (filters.remote === 'remote') payload.remote = true
    if (filters.remote === 'onsite') payload.remote = false
    if (filters.experience_level) payload.experience_level = filters.experience_level
    if (filters.role_type) payload.role_type = filters.role_type
    if (filters.company_stages.trim()) {
      payload.company_stages = filters.company_stages
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    }
    if (filters.salary_min !== '') payload.salary_min = Number(filters.salary_min)
    if (filters.salary_max !== '') payload.salary_max = Number(filters.salary_max)
    if (filters.excludes.trim()) {
      payload.excludes = filters.excludes
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    }
    return Object.keys(payload).length ? payload : null
  }

  // Auto-search when navigated here with ?q= param (from HomePage)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !didAutoSearch.current) {
      didAutoSearch.current = true
      setInputValue(q)
      search(q, { filters: buildFiltersPayload() })
    }
  }, [searchParams, search, filters])

  // Keep input in sync with active query
  useEffect(() => {
    if (query) setInputValue(query)
  }, [query])

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!inputValue.trim() || loading) return
    search(inputValue.trim(), { filters: buildFiltersPayload() })
  }

  const handleRecent = (q) => {
    setInputValue(q)
    search(q, { filters: buildFiltersPayload() })
  }

  const handleReset = () => {
    reset()
    setInputValue('')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Sticky compact search bar ── */}
      <div
        className="sticky top-0 z-10 px-6 py-4"
        style={{
          backgroundColor: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {/* Resume context dot */}
          {profile && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
              style={{
                backgroundColor: 'rgba(34,197,94,0.10)',
                color: '#16a34a',
                border: '1px solid rgba(34,197,94,0.20)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              {profile.parsed_profile?.name?.split(' ')[0] || 'Resume'}
            </span>
          )}

          {/* Terminal-style search input */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
            <div
              className="relative flex-1 flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-150 group"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
              onFocus={() => {}}
            >
              {/* Terminal prompt */}
              <span className="text-[var(--accent)] font-mono text-base select-none leading-none shrink-0">›</span>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="describe the role you're looking for..."
                className="flex-1 bg-transparent font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-4)] outline-none caret-[var(--accent)] min-w-0"
                style={{ letterSpacing: '-0.01em' }}
                onFocus={e => {
                  e.target.closest('div').style.borderColor = 'var(--accent)'
                  e.target.closest('div').style.boxShadow = '0 0 0 3px var(--accent-light)'
                }}
                onBlur={e => {
                  e.target.closest('div').style.borderColor = 'var(--border)'
                  e.target.closest('div').style.boxShadow = 'none'
                }}
              />
              {/* Blinking cursor when idle */}
              {!inputValue && !loading && (
                <span className="terminal-cursor w-0.5 h-3.5 bg-[var(--accent)] rounded-sm shrink-0 opacity-60" />
              )}
              {/* Clear */}
              {inputValue && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="shrink-0 text-[var(--text-4)] hover:text-[var(--text-3)] transition-colors"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="flex items-center gap-1.5 text-xs font-semibold font-mono px-4 py-2.5 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ backgroundColor: 'var(--accent)', color: '#000' }}
            >
              {loading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : '⟶'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setFiltersOpen(v => !v)}
            className="text-xs font-medium px-3 py-2 rounded-lg transition-all"
            style={{
              color: 'var(--text-3)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            {filtersOpen ? 'Hide filters' : 'Advanced filters'}
          </button>
        </div>

        {filtersOpen && (
          <div className="max-w-3xl mx-auto mt-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <input
                value={filters.location}
                onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
                placeholder="Location"
                className="px-2 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              <select
                value={filters.remote}
                onChange={e => setFilters(f => ({ ...f, remote: e.target.value }))}
                className="px-2 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="any">Remote or On-site</option>
                <option value="remote">Remote only</option>
                <option value="onsite">On-site only</option>
              </select>
              <select
                value={filters.experience_level}
                onChange={e => setFilters(f => ({ ...f, experience_level: e.target.value }))}
                className="px-2 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="">Any seniority</option>
                <option value="entry">Entry</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="staff">Staff</option>
                <option value="principal">Principal</option>
              </select>
              <select
                value={filters.role_type}
                onChange={e => setFilters(f => ({ ...f, role_type: e.target.value }))}
                className="px-2 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="">Any role type</option>
                <option value="full-time">Full-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="part-time">Part-time</option>
                <option value="freelance">Freelance</option>
              </select>
              <input
                value={filters.company_stages}
                onChange={e => setFilters(f => ({ ...f, company_stages: e.target.value }))}
                placeholder="Stages (e.g. startup,series a)"
                className="px-2 py-1.5 rounded-lg text-xs sm:col-span-2"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              <input
                type="number"
                value={filters.salary_min}
                onChange={e => setFilters(f => ({ ...f, salary_min: e.target.value }))}
                placeholder="Min salary"
                className="px-2 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              <input
                type="number"
                value={filters.salary_max}
                onChange={e => setFilters(f => ({ ...f, salary_max: e.target.value }))}
                placeholder="Max salary"
                className="px-2 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              <input
                value={filters.excludes}
                onChange={e => setFilters(f => ({ ...f, excludes: e.target.value }))}
                placeholder="Exclude keywords (comma-separated)"
                className="px-2 py-1.5 rounded-lg text-xs sm:col-span-2"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setFilters({
                  location: '',
                  remote: 'any',
                  experience_level: '',
                  role_type: '',
                  company_stages: '',
                  salary_min: '',
                  salary_max: '',
                  excludes: '',
                })}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-12">

        {/* ── Idle state: recent searches ── */}
        {!hasSearched && (
          <div className="max-w-3xl mx-auto">
            {recentQueries.length > 0 ? (
              <>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--text-4)' }}
                >
                  Recent searches
                </p>
                <div className="space-y-2">
                  {recentQueries.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecent(q)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left group query-item"
                    >
                      <span style={{ color: 'var(--text-4)' }}>
                        <ClockIcon />
                      </span>
                      <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-3)' }}>
                        {q}
                      </span>
                      <span
                        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        style={{ color: 'var(--accent)' }}
                      >
                        Search →
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-sm" style={{ color: 'var(--text-4)' }}>
                  No recent searches. Type above to get started.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Results ── */}
        {hasSearched && (
          <>
            {!loading && (
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>
                  {total} match{total !== 1 ? 'es' : ''} for{' '}
                  <span style={{ color: 'var(--text-3)' }}>"{query}"</span>
                  {totalPages > 1 && (
                    <span style={{ color: 'var(--text-4)' }}> · Page {currentPage} of {totalPages}</span>
                  )}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />

                {/* Sort dropdown — only useful when there are results */}
                {results.length > 0 && (
                  <select
                    value={sortBy}
                    onChange={e => changeSortBy(e.target.value, { filters: buildFiltersPayload() })}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-3)',
                      outline: 'none',
                    }}
                  >
                    <option value="relevance">Most Relevant</option>
                    <option value="recent">Most Recent</option>
                  </select>
                )}

                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xs font-medium link-accent"
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

            {/* Page number pagination */}
            {!loading && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => goToPage(page, { filters: buildFiltersPayload() })}
              />
            )}
          </>
        )}
      </div>

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
