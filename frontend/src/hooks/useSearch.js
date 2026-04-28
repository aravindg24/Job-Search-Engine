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

function saveSession(query, results, page, sortBy, total) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ query, results, page, sortBy, total })) } catch { /* ignore */ }
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

  const [results,       setResults]       = useState(saved?.results || [])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [query,         setQuery]         = useState(saved?.query  || '')
  const [hasSearched,   setHasSearched]   = useState(!!saved)
  const [recentQueries, setRecentQueries] = useState(() => loadRecent())
  const [currentPage,   setCurrentPage]   = useState(saved?.page  || 1)
  const [total,         setTotal]         = useState(saved?.total || 0)
  const [sortBy,        setSortBy]        = useState(saved?.sortBy || 'relevance')

  const PAGE_SIZE = 10
  const totalPages = Math.ceil(total / PAGE_SIZE)

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

  const fetchPage = useCallback(async (queryText, page, sort, options = {}) => {
    const offset = (page - 1) * PAGE_SIZE
    setLoading(true)
    setError(null)
    try {
      const data = await searchJobs({ query: queryText, top_k: PAGE_SIZE, offset, sort_by: sort, ...options })
      const hits = data.results || []
      const fetchedTotal = data.total || 0
      setResults(hits)
      setTotal(fetchedTotal)
      saveSession(queryText, hits, page, sort, fetchedTotal)
      return hits
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed. Make sure the backend is running.')
      setResults([])
      setTotal(0)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const search = useCallback(async (queryText, options = {}) => {
    if (!queryText.trim()) return
    setQuery(queryText)
    setCurrentPage(1)
    setHasSearched(true)
    await fetchPage(queryText, 1, sortBy, options)
    setRecentQueries(pushRecent(queryText))
  }, [sortBy, fetchPage])

  const goToPage = useCallback(async (page, options = {}) => {
    if (!query.trim() || loading) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    await fetchPage(query, page, sortBy, options)
  }, [query, sortBy, loading, fetchPage])

  const changeSortBy = useCallback(async (newSort, options = {}) => {
    setSortBy(newSort)
    if (!query.trim()) return
    setCurrentPage(1)
    await fetchPage(query, 1, newSort, options)
  }, [query, fetchPage])

  const reset = useCallback(() => {
    setResults([])
    setQuery('')
    setError(null)
    setHasSearched(false)
    setCurrentPage(1)
    setTotal(0)
    setSortBy('relevance')
    clearSession()
  }, [])

  return { results, loading, error, query, hasSearched, recentQueries, search, reset, currentPage, total, totalPages, goToPage, sortBy, changeSortBy }
}
