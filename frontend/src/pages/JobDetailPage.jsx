import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MatchBreakdown from '../components/job/MatchBreakdown'
import PitchGenerator from '../components/job/PitchGenerator'
import { trackJob, saveJob, unsaveJob } from '../utils/api'
import { toast } from '../components/shared/Toast'
import { formatDate } from '../utils/format'

function Section({ title, children, action }) {
  return (
    <section
      className="rounded-xl p-5 mb-4"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span
            className="w-1 h-4 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          />
          <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            {title}
          </h2>
        </div>
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
  const [jobIsSaved, setJobIsSaved] = useState(job?.job_is_saved || false)
  const [isSavingJob, setIsSavingJob] = useState(false)

  useEffect(() => {
    if (job) {
      setJobIsSaved(job.job_is_saved || false)
    }
  }, [job])

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>Job not found in session.</p>
        <button
          onClick={() => navigate('/search')}
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

  const handleSaveJob = async () => {
    setIsSavingJob(true)
    try {
      if (jobIsSaved) {
        await unsaveJob(job.id)
        setJobIsSaved(false)
        toast('Removed from saved jobs')
      } else {
        await saveJob(job.id)
        setJobIsSaved(true)
        toast('Added to saved jobs')
      }
    } catch {
      toast('Failed to save job', 'error')
    } finally {
      setIsSavingJob(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm mb-6 flex items-center gap-1.5 transition-colors duration-150"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        ← Back to results
      </button>

      {/* ── Job header ── */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1
              className="font-serif text-2xl leading-snug font-semibold mb-1"
            >
              {job.title}
            </h1>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
              <span className="text-base font-medium" style={{ color: 'var(--text-2)' }}>
                {job.company}
              </span>
              {job.location && (
                <span className="text-sm" style={{ color: 'var(--text-4)' }}>· {job.location}</span>
              )}
              {job.remote && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{ backgroundColor: 'rgba(232,255,71,0.12)', color: 'var(--accent)', border: '1px solid rgba(232,255,71,0.2)' }}
                >
                  Remote
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: 'var(--text-4)' }}>
              {job.salary_range && <span>{job.salary_range}</span>}
              {job.company_stage && <span>{job.company_stage}</span>}
              {job.posted_date && <span>Posted {formatDate(job.posted_date)}</span>}
              {job.source && <span className="capitalize">{job.source}</span>}
            </div>
          </div>
        </div>

        {/* Action buttons in header */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          {job.source_url && (
            <a
              href={job.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-150 inline-flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Apply ↗
            </a>
          )}
          <TrackButton
            onClick={handleSaveJob}
            disabled={isSavingJob}
            active={jobIsSaved}
            activeStyle={{ color: 'var(--accent)', borderColor: 'rgba(232,255,71,0.25)', backgroundColor: 'rgba(232,255,71,0.06)' }}
          >
            {jobIsSaved ? '♥ Saved' : 'Save Job'}
          </TrackButton>
          <TrackButton
            onClick={() => handleTrack('saved')}
            disabled={saving || status === 'saved'}
            active={status === 'saved'}
            activeStyle={{ color: '#16a34a', borderColor: 'rgba(34,197,94,0.25)', backgroundColor: 'rgba(34,197,94,0.06)' }}
          >
            {status === 'saved' ? '✓ Tracked' : 'Track Job'}
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

      {/* ── 2-column body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left col — analysis + description */}
        <div className="lg:col-span-3">
          <Section title="Match Analysis">
            <MatchBreakdown job={job} query={query} />
          </Section>

          <Section
            title="Full Job Description"
            action={
              <button
                onClick={() => setShowDesc(!showDesc)}
                className="text-xs transition-colors duration-150"
                style={{ color: 'var(--text-4)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
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
              <p className="text-sm" style={{ color: 'var(--text-4)' }}>
                Click <span style={{ color: 'var(--text-3)' }}>Expand</span> to read the full description.
              </p>
            )}
          </Section>
        </div>

        {/* Right col — pitch generator */}
        <div className="lg:col-span-2">
          <Section title="Generate Pitch">
            <PitchGenerator jobId={job.id} />
          </Section>
        </div>

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
