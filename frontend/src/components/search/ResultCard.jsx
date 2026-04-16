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
      className="rounded-xl p-5 cursor-pointer animate-slide-up group transition-all duration-200"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px var(--shadow)',
        animationDelay: `${index * 55}ms`,
        animationFillMode: 'both',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(252,170,45,0.30)'
        e.currentTarget.style.boxShadow = '0 4px 16px var(--shadow-lg)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = '0 1px 3px var(--shadow)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
      onClick={() => navigate(`/job/${job.id}`, { state: { job, query } })}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="min-w-0 flex-1">
          <h3
            className="font-semibold text-sm leading-snug truncate transition-colors duration-150 group-hover:text-accent"
            style={{ color: 'var(--text)', fontFamily: 'Inter, system-ui' }}
          >
            {job.title}
          </h3>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1">
            <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
              {job.company}
            </span>
            {job.location && (
              <span className="text-xs" style={{ color: 'var(--text-4)' }}>
                · {job.location}
              </span>
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
      </div>

      {/* Meta row */}
      {(job.salary_range || job.company_stage || job.posted_date) && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mb-3" style={{ color: 'var(--text-4)' }}>
          {job.salary_range && <span>{job.salary_range}</span>}
          {job.company_stage && (
            <span
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
            >
              {job.company_stage}
            </span>
          )}
          {job.posted_date && <span>{job.posted_date}</span>}
        </div>
      )}

      {/* Match reason */}
      {job.match_reason && (
        <p
          className="text-sm leading-relaxed mb-3 italic"
          style={{ color: 'var(--text-3)' }}
        >
          "{truncate(job.match_reason, 140)}"
        </p>
      )}

      {/* Skill tags */}
      {job.requirements?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.requirements.slice(0, 6).map(r => (
            <span
              key={r}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--bg-2)',
                color: 'var(--text-3)',
                border: '1px solid var(--border)',
              }}
            >
              {r}
            </span>
          ))}
          {job.requirements.length > 6 && (
            <span className="text-xs" style={{ color: 'var(--text-4)' }}>
              +{job.requirements.length - 6}
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="h-px mb-3" style={{ backgroundColor: 'var(--border-2)' }} />

      {/* Actions */}
      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <ActionButton
          onClick={handleSave}
          disabled={saving || saved}
          active={saved}
          activeStyle={{ color: '#16a34a', borderColor: 'rgba(34,197,94,0.25)', backgroundColor: 'rgba(34,197,94,0.06)' }}
        >
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
        </ActionButton>
        <ActionButton onClick={() => onPitch && onPitch(job)}>
          Generate Pitch
        </ActionButton>
        {job.source_url && (
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150 inline-flex items-center gap-1"
            style={{
              backgroundColor: 'rgba(252,170,45,0.10)',
              color: 'var(--accent)',
              border: '1px solid rgba(252,170,45,0.25)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(252,170,45,0.18)'
              e.currentTarget.style.borderColor = 'rgba(252,170,45,0.45)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(252,170,45,0.10)'
              e.currentTarget.style.borderColor = 'rgba(252,170,45,0.25)'
            }}
          >
            Apply ↗
          </a>
        )}
        <button
          onClick={() => navigate(`/job/${job.id}`, { state: { job, query } })}
          className="ml-auto text-xs transition-colors duration-150"
          style={{ color: 'var(--text-4)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
        >
          Details →
        </button>
      </div>
    </div>
  )
}

function ActionButton({ children, onClick, disabled, active, activeStyle }) {
  const base = {
    backgroundColor: 'var(--surface-2)',
    color: 'var(--text-3)',
    border: '1px solid var(--border)',
  }
  const hover = {
    backgroundColor: 'var(--bg-3)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      style={active ? activeStyle : base}
      onMouseEnter={e => { if (!disabled && !active) Object.assign(e.currentTarget.style, hover) }}
      onMouseLeave={e => { if (!active) Object.assign(e.currentTarget.style, base) }}
    >
      {children}
    </button>
  )
}
