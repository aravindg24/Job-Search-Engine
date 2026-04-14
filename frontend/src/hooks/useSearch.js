import { useState, useCallback, useEffect } from 'react'
import { searchJobs, getSearchHistory } from '../utils/api'

const SESSION_KEY = 'direct_last_search'   // sessionStorage — survives back-nav, clears on tab close
const RECENT_KEY  = 'direct_recent_queries' // localStorage   — instant cache while API loads

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

// ── localStorage helpers (recent query list — instant cache) ──────────────────

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function saveRecent(queries) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(queries)) } catch { /* ignore */ }
}

function pushRecent(query) {
  const prev    = loadRecent()
  const deduped = prev.filter(q => q.toLowerCase() !== query.toLowerCase())
  const updated = [query, ...deduped].slice(0, MAX_RECENT)
  saveRecent(updated)
  return updated
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSearch() {
  const saved = loadSession()

  const [results,      setResults]      = useState(saved?.results || [])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [query,        setQuery]        = useState(saved?.query  || '')
  const [hasSearched,  setHasSearched]  = useState(!!saved)
  const [recentQueries, setRecentQueries] = useState(() => loadRecent())
  const [offset,       setOffset]       = useState(0)
  const [total,        setTotal]        = useState(0)

  // On mount: fetch server-side history and merge with local cache.
  // Local cache shows instantly (zero latency); server data updates if different.
  useEffect(() => {
    let cancelled = false
    getSearchHistory()
      .then(data => {
        if (cancelled) return
        const serverQueries = data?.queries || []
        if (serverQueries.length === 0) return

        // Merge: server queries first, then any local-only ones, deduplicate
        const local = loadRecent()
        const merged = [...serverQueries]
        for (const q of local) {
          if (!merged.some(s => s.toLowerCase() === q.toLowerCase())) {
            merged.push(q)
          }
        }
        const top5 = merged.slice(0, MAX_RECENT)
        saveRecent(top5)
        setRecentQueries(top5)
      })
      .catch(() => { /* silently fall back to localStorage */ })
    return () => { cancelled = true }
  }, [])

  const search = useCallback(async (queryText, options = {}) => {
    if (!queryText.trim()) return
    setQuery(queryText)
    setOffset(0)
    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const data = await searchJobs({ query: queryText, top_k: 10, offset: 0, ...options })
      const hits  = data.results || []
      setResults(hits)
      setTotal(data.total || 0)
      saveSession(queryText, hits)
      setRecentQueries(pushRecent(queryText))
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed. Make sure the backend is running.')
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async (options = {}) => {
    if (!query.trim() || loading) return
    const nextOffset = offset + 10
    if (nextOffset >= total) return // No more results

    setLoading(true)
    setError(null)

    try {
      const data = await searchJobs({ query, top_k: 10, offset: nextOffset, ...options })
      const hits = data.results || []
      setResults(prev => [...prev, ...hits])
      setOffset(nextOffset)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load more results.')
    } finally {
      setLoading(false)
    }
  }, [query, offset, total, loading])

  const reset = useCallback(() => {
    setResults([])
    setQuery('')
    setError(null)
    setHasSearched(false)
    setOffset(0)
    setTotal(0)
    clearSession()
  }, [])

  return { results, loading, error, query, hasSearched, recentQueries, search, reset, offset, total, loadMore }
}
