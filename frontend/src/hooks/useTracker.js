import { useState, useEffect, useCallback } from 'react'
import { trackJob, getTrackedJobs, removeTrackedJob } from '../utils/api'

export function useTracker() {
  const [data, setData] = useState({ stats: {}, jobs: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getTrackedJobs()
      setData(result)
    } catch (err) {
      if (err.response?.status) {
        setError(err.response?.data?.detail || 'Failed to load tracker.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const save = useCallback(async (jobData) => {
    await trackJob(jobData)
    await fetch()
  }, [fetch])

  const remove = useCallback(async (jobId) => {
    await removeTrackedJob(jobId)
    await fetch()
  }, [fetch])

  const updateStatus = useCallback(async (jobId, status) => {
    const job = data.jobs.find(j => j.job_id === jobId)
    if (!job) return
    await trackJob({
      job_id: jobId,
      job_title: job.job_title || '',
      company: job.company || '',
      match_score: job.match_score,
      status,
      notes: job.notes,
      pitch: job.pitch,
      applied_date: job.applied_date,
    })
    await fetch()
  }, [data.jobs, fetch])

  return { data, loading, error, save, remove, updateStatus, refetch: fetch }
}
