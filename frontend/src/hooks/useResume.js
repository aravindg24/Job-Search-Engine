import { useState, useEffect, useCallback } from 'react'
import { uploadResume, getResumeProfile } from '../utils/api'

export function useResume() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getResumeProfile()
      setProfile(data)
    } catch (err) {
      // Ignore 404 (no resume yet) and network errors (backend not running)
      const status = err.response?.status
      if (status && status !== 404) {
        setError(err.response?.data?.detail || 'Failed to load profile.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const upload = useCallback(async (file) => {
    setUploading(true)
    setError(null)
    try {
      const data = await uploadResume(file)
      setProfile({ parsed_profile: data.profile, id: data.id, uploaded_at: new Date().toISOString() })
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.')
      throw err
    } finally {
      setUploading(false)
    }
  }, [])

  return { profile, loading, uploading, error, upload, refetch: fetchProfile }
}
