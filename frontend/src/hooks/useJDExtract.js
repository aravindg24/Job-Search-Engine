import { useState } from 'react'
import { extractJD } from '../utils/api'

export function useJDExtract() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const extract = async (url, query = null) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await extractJD({ url, query })
      setResult(data)
      return data
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to extract job from URL'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, extract }
}
