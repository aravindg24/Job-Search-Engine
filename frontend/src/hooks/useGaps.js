import { useState, useCallback } from 'react'
import { getGaps } from '../utils/api'

export function useGaps() {
  const [gaps, setGaps] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(async (searchId = null) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getGaps(searchId)
      setGaps(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load gap analysis.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { gaps, loading, error, fetch }
}
