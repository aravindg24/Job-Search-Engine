import { useState, useCallback } from 'react'
import { searchJobs } from '../utils/api'

const STORAGE_KEY = 'direct_last_search'

function loadSaved() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveTosession(query, results) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ query, results }))
  } catch {
    // quota exceeded or private mode — fail silently
  }
}

function clearSession() {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

export function useSearch() {
  // Restore last search from sessionStorage so navigating to a job detail
  // page and pressing "← Back to results" shows the previous results.
  const saved = loadSaved()

  const [results, setResults]       = useState(saved?.results || [])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [query, setQuery]           = useState(saved?.query || '')
  const [hasSearched, setHasSearched] = useState(!!saved)

  const search = useCallback(async (queryText, options = {}) => {
    if (!queryText.trim()) return
    setQuery(queryText)
    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const data = await searchJobs({ query: queryText, top_k: 10, ...options })
      const hits = data.results || []
      setResults(hits)
      saveTosession(queryText, hits)
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

  return { results, loading, error, query, hasSearched, search, reset }
}
