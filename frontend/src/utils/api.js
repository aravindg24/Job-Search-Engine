import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export async function searchJobs({ query, top_k = 10, filters = null }) {
  const { data } = await api.post('/search', { query, top_k, filters })
  return data
}

export async function explainMatch({ query, job_id }) {
  const { data } = await api.post('/explain', { query, job_id })
  return data
}

export async function healthCheck() {
  const { data } = await api.get('/health')
  return data
}
