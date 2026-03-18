import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import MatchBadge from '../components/shared/MatchBadge'
import MatchBreakdown from '../components/job/MatchBreakdown'
import PitchGenerator from '../components/job/PitchGenerator'
import { trackJob } from '../utils/api'
import { toast } from '../components/shared/Toast'
import { formatDate } from '../utils/format'

function Section({ title, children, action }) {
  return (
    <section
      className="rounded-xl p-5 mb-4"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: 'var(--text-4)' }}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function JobDetailPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const job = state?.job
  const query = state?.query || ''

  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showDesc, setShowDesc] = useState(false)

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>Job not found in session.</p>
        <button
          onClick={() => navigate('/')}
          className="text-sm transition-colors duration-150"
          style={{ color: 'var(--accent)' }}
        >
          ← Back to search
        </button>
      </div>
    )
  }

  const handleTrack = async (newStatus) => {
    setSaving(true)
    try {
      await trackJob({
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        match_score: job.match_score,
        status: newStatus,
      })
      setStatus(newStatus)
      toast(newStatus === 'saved' ? 'Saved to tracker' : `Marked as ${newStatus}`)
    } catch {
      toast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm mb-7 flex items-center gap-1 transition-colors duration-150"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        ← Back to results
      </button>

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl leading-snug font-semibold"
              style={{ color: 'var(--text)', fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              {job.title}
            </h1>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
              <span className="text-base font-medium" style={{ color: 'var(--text-2)' }}>
                {job.company}
              </span>
              {job.location && (
                <span className="text-sm" style={{ color: 'var(--text-4)' }}>· {job.location}</span>
              )}
              {job.remote && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: 'rgba(252,170,45,0.12)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(252,170,45,0.20)',
                  }}
                >
                  Remote
                </span>
              )}
            </div>
          </div>
          <MatchBadge score={job.match_score} size="lg" />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs" style={{ color: 'var(--text-4)' }}>
          {job.salary_range && <span>{job.salary_range}</span>}
          {job.company_stage && <span>{job.company_stage}</span>}
          {job.posted_date && <span>Posted {formatDate(job.posted_date)}</span>}
          {job.source && <span className="capitalize">{job.source}</span>}
        </div>
      </div>

      {/* Match breakdown */}
      <Section title="Match Analysis">
        <MatchBreakdown job={job} query={query} />
      </Section>

      {/* Pitch generator */}
      <Section title="Generate Pitch">
        <PitchGenerator jobId={job.id} />
      </Section>

      {/* Job description */}
      <Section
        title="Full Job Description"
        action={
          <button
            onClick={() => setShowDesc(!showDesc)}
            className="text-xs transition-colors duration-150"
            style={{ color: 'var(--text-4)' }}
          >
            {showDesc ? 'Collapse ▲' : 'Expand ▼'}
          </button>
        }
      >
        {showDesc ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-3)' }}>
            {job.description}
          </p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-4)' }}>Click Expand to read the full description.</p>
        )}
      </Section>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mt-6">
        {job.source_url && (
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-150"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e8940a'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--accent)'}
          >
            Apply ↗
          </a>
        )}
        <TrackButton
          onClick={() => handleTrack('saved')}
          disabled={saving || status === 'saved'}
          active={status === 'saved'}
          activeStyle={{ color: '#16a34a', borderColor: 'rgba(34,197,94,0.25)', backgroundColor: 'rgba(34,197,94,0.06)' }}
        >
          {status === 'saved' ? '✓ Saved' : 'Save to Tracker'}
        </TrackButton>
        <TrackButton
          onClick={() => handleTrack('applied')}
          disabled={saving || status === 'applied'}
          active={status === 'applied'}
          activeStyle={{ color: '#2563eb', borderColor: 'rgba(37,99,235,0.25)', backgroundColor: 'rgba(37,99,235,0.06)' }}
        >
          {status === 'applied' ? '✓ Applied' : 'Mark as Applied'}
        </TrackButton>
      </div>
    </div>
  )
}

function TrackButton({ children, onClick, disabled, active, activeStyle }) {
  const base = {
    backgroundColor: 'var(--surface-2)',
    color: 'var(--text-3)',
    border: '1px solid var(--border)',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-sm px-4 py-2 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      style={active ? activeStyle : base}
      onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.color = 'var(--text)' }}
      onMouseLeave={e => { if (!active) Object.assign(e.currentTarget.style, base) }}
    >
      {children}
    </button>
  )
}
