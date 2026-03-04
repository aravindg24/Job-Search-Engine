import { useState, useCallback } from 'react'
import { searchJobs } from '../utils/api'

export function useSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const search = useCallback(async (queryText, options = {}) => {
    if (!queryText.trim()) return
    setQuery(queryText)
    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const data = await searchJobs({ query: queryText, top_k: 10, ...options })
      setResults(data.results || [])
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
  }, [])

  return { results, loading, error, query, hasSearched, search, reset }
}
