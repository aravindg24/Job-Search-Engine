import { useState, useCallback } from 'react'
import { getDigest, refreshDigest } from '../utils/api'

export function useDigest() {
  const [digest, setDigest] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDigest()
      setDigest(data)
    } catch (err) {
      if (err.response?.status) {
        setError(err.response?.data?.detail || 'Failed to load digest.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      await refreshDigest()
      await fetch()
    } catch (err) {
      setError(err.response?.data?.detail || 'Refresh failed.')
    } finally {
      setRefreshing(false)
    }
  }, [fetch])

  return { digest, loading, refreshing, error, fetch, refresh }
}
