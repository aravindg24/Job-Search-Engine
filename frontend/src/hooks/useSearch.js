import { useState, useCallback } from 'react'
import { searchJobs } from '../utils/api'

const SESSION_KEY = 'direct_last_search'   // sessionStorage — survives back-nav, clears on tab close
const RECENT_KEY  = 'direct_recent_queries' // localStorage   — persists across sessions

const MAX_RECENT = 5

// ── sessionStorage helpers (last search result, for back-nav restore) ─────────

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSession(query, results) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ query, results })) } catch { /* ignore */ }
}

export function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
}

// ── localStorage helpers (recent query list) ──────────────────────────────────

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function pushRecent(query) {
  const prev    = loadRecent()
  const deduped = prev.filter(q => q.toLowerCase() !== query.toLowerCase())
  const updated = [query, ...deduped].slice(0, MAX_RECENT)
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
  return updated
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSearch() {
  const saved = loadSession()

  const [results,    setResults]    = useState(saved?.results || [])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [query,      setQuery]      = useState(saved?.query  || '')
  const [hasSearched,setHasSearched]= useState(!!saved)
  const [recentQueries, setRecentQueries] = useState(() => loadRecent())

  const search = useCallback(async (queryText, options = {}) => {
    if (!queryText.trim()) return
    setQuery(queryText)
    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const data = await searchJobs({ query: queryText, top_k: 10, ...options })
      const hits  = data.results || []
      setResults(hits)
      saveSession(queryText, hits)
      setRecentQueries(pushRecent(queryText))
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed. Make sure the backend is running.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResults([])
    setQuery('')
    setError(null)
    setHasSearched(false)
    clearSession()
  }, [])

  return { results, loading, error, query, hasSearched, recentQueries, search, reset }
}
