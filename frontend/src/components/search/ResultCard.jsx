import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { truncate } from '../../utils/format'
import { trackJob } from '../../utils/api'
import { toast } from '../shared/Toast'

export default function ResultCard({ job, index, query, onPitch }) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async (e) => {
    e.stopPropagation()
    setSaving(true)
    try {
      await trackJob({
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        match_score: job.match_score,
        status: 'saved',
      })
      setSaved(true)
      toast('Saved to tracker')
    } catch {
      toast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="card p-5 cursor-pointer animate-slide-up"
      style={{
        animationDelay: `${index * 55}ms`,
        animationFillMode: 'both',
      }}
      onClick={() => navigate(`/job/${job.id}`, { state: { job, query } })}
    >
      {/* Header row — title + badge */}
      <div className="flex items-start gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug truncate text-[var(--text)] group-hover:text-[var(--accent)] transition-colors duration-150">
            {job.title}
          </h3>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
            <span className="text-sm font-medium text-[var(--text-3)]">
              {job.company}
            </span>
            {job.location && (
              <span className="text-xs text-[var(--text-4)]">· {job.location}</span>
            )}
            {job.remote && (
              <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[rgba(252,170,45,0.20)]">
                Remote
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meta row */}
      {(job.salary_range || job.company_stage || job.posted_date) && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--text-4)] mb-3">
          {job.salary_range && <span>{job.salary_range}</span>}
          {job.company_stage && (
            <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--border)]">
              {job.company_stage}
            </span>
          )}
          {job.posted_date && <span>{job.posted_date}</span>}
        </div>
      )}

      {/* Match reason */}
      {job.match_reason && (
        <p className="text-sm leading-relaxed mb-3 italic text-[var(--text-3)]">
          "{truncate(job.match_reason, 140)}"
        </p>
      )}

      {/* Skill tags */}
      {job.requirements?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.requirements.slice(0, 6).map(r => (
            <span
              key={r}
              className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-2)] text-[var(--text-3)] border border-[var(--border)]"
            >
              {r}
            </span>
          ))}
          {job.requirements.length > 6 && (
            <span className="text-xs text-[var(--text-4)]">
              +{job.requirements.length - 6}
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-[var(--border-2)] mb-3" />

      {/* Actions */}
      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-150 border font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            ${saved
              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50'
              : 'btn-secondary'
            }`}
        >
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onPitch && onPitch(job) }}
          className="text-xs px-3 py-1.5 rounded-lg btn-secondary font-medium"
        >
          Generate Pitch
        </button>

        {job.source_url && (
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150 inline-flex items-center gap-1 font-medium
              bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[rgba(252,170,45,0.25)]
              hover:bg-[rgba(252,170,45,0.18)] hover:border-[rgba(252,170,45,0.45)]"
          >
            Apply ↗
          </a>
        )}

        <button
          onClick={() => navigate(`/job/${job.id}`, { state: { job, query } })}
          className="ml-auto text-xs link-muted"
        >
          Details →
        </button>
      </div>
    </div>
  )
}
