import { useState } from 'react'
import { useJDExtract } from '../hooks/useJDExtract'
import MatchBadge from '../components/shared/MatchBadge'

export default function JDAnalyzePage() {
  const [url, setUrl] = useState('')
  const { result, loading, error, extract } = useJDExtract()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url.trim()) extract(url.trim())
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6 animate-fade-in">
      <div>
        <h1
          className="font-serif text-2xl font-semibold mb-1"
        >
          Analyze a Job Posting
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Paste a job URL to get an instant match breakdown against your resume.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://jobs.example.com/posting/12345"
          required
          className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', color: '#000' }}
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </form>

      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {/* Job summary */}
          <div
            className="rounded-xl p-5 space-y-1"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
                  {result.title || 'Unknown Title'}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {result.company}{result.location ? ` · ${result.location}` : ''}
                  {result.remote ? ' · Remote' : ''}
                </p>
              </div>
              {result.match_score != null && (
                <MatchBadge score={result.match_score} size="lg" />
              )}
            </div>
          </div>

          {/* Pitch suggestion */}
          {result.pitch_suggestion && (
            <div
              className="rounded-xl p-4 text-sm italic leading-relaxed"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-2)',
              }}
            >
              <span className="font-semibold not-italic" style={{ color: 'var(--text)' }}>
                Suggestion:{' '}
              </span>
              {result.pitch_suggestion}
            </div>
          )}

          {/* Raw description fallback */}
          {!result.blocks?.length && result.job_text && (
            <div
              className="rounded-xl p-4 text-sm leading-relaxed"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-3)',
                whiteSpace: 'pre-wrap',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {result.job_text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
