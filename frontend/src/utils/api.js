import axios from 'axios'

// In production (Vercel), VITE_API_URL points to the Render backend.
// In development, it's empty and Vite's proxy forwards /api → localhost:8000.
const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
})

// ── Search ─────────────────────────────────────────────────────────────────────

export const searchJobs = ({ query, top_k = 10, filters = null }) =>
  api.post('/search', { query, top_k, filters }).then(r => r.data)

export const explainMatch = ({ query, job_id }) =>
  api.post('/explain', { query, job_id }).then(r => r.data)

// ── Resume ─────────────────────────────────────────────────────────────────────

export const uploadResume = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/resume/upload', form).then(r => r.data)
}

export const getResumeProfile = () =>
  api.get('/resume/profile').then(r => r.data)

// ── Pitch ──────────────────────────────────────────────────────────────────────

export const generatePitch = (jobId, pitchType = 'cover_letter_hook') =>
  api.post('/pitch', { job_id: jobId, pitch_type: pitchType }).then(r => r.data)

// ── Gaps ───────────────────────────────────────────────────────────────────────

export const getGaps = (searchId = null) =>
  api.get('/gaps', { params: searchId ? { search_id: searchId } : {} }).then(r => r.data)

// ── Tracker ────────────────────────────────────────────────────────────────────

export const trackJob = (data) =>
  api.post('/track', data).then(r => r.data)

export const getTrackedJobs = () =>
  api.get('/track').then(r => r.data)

export const removeTrackedJob = (jobId) =>
  api.delete(`/track/${jobId}`).then(r => r.data)

// ── Watch / Digest ─────────────────────────────────────────────────────────────

export const saveWatchPreferences = (prefs) =>
  api.post('/watch', prefs).then(r => r.data)

export const getWatchPreferences = () =>
  api.get('/watch').then(r => r.data)

export const getDigest = () =>
  api.get('/digest').then(r => r.data)

export const refreshDigest = () =>
  api.post('/digest/refresh').then(r => r.data)

// ── Health ─────────────────────────────────────────────────────────────────────

export const healthCheck = () =>
  api.get('/health').then(r => r.data)
