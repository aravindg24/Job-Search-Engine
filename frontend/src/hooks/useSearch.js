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
