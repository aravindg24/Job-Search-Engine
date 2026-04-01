import { timeAgo } from '../../utils/format'
import MatchBadge from '../shared/MatchBadge'

const COLUMNS = [
  { key: 'saved',        label: 'Saved',        color: '#71717a' },
  { key: 'applied',      label: 'Applied',       color: '#3b82f6' },
  { key: 'interviewing', label: 'Interviewing',  color: '#a78bfa' },
  { key: 'offered',      label: 'Offered',       color: '#22c55e' },
  { key: 'rejected',     label: 'Rejected',      color: '#ef4444' },
  { key: 'withdrawn',    label: 'Withdrawn',     color: '#f59e0b' },
]

function TrackerCard({ job, onStatusChange, onRemove }) {
  return (
    <div
      className="rounded-xl p-3 text-sm space-y-2"
      style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate text-sm" style={{ color: 'var(--text)' }}>
            {job.job_title || 'Unknown role'}
          </p>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-3)' }}>
            {job.company}
          </p>
        </div>
        <MatchBadge score={job.match_score} />
      </div>

      {job.updated_at && (
        <p className="text-xs" style={{ color: 'var(--text-4)' }}>{timeAgo(job.updated_at)}</p>
      )}

      {job.notes && (
        <p className="text-xs italic truncate" style={{ color: 'var(--text-4)' }}>{job.notes}</p>
      )}

      <div className="flex items-center gap-1.5 pt-1">
        <select
          value={job.status}
          onChange={e => onStatusChange(job.job_id, e.target.value)}
          className="text-xs rounded-lg px-2 py-1 flex-1 outline-none"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-3)',
          }}
        >
          {COLUMNS.map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        <button
          onClick={() => onRemove(job.job_id)}
          title="Remove"
          className="text-xs px-1.5 py-1 rounded-lg transition-colors"
          style={{ color: 'var(--text-4)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function TrackerBoard({ jobs, stats, onStatusChange, onRemove }) {
  const totalActive = (stats?.saved || 0) + (stats?.applied || 0) + (stats?.interviewing || 0)

  return (
    <div>
      {/* Stats strip */}
      <div className="flex flex-wrap gap-3 mb-5">
        {COLUMNS.map(({ key, label, color }) => {
          const val = stats?.[key] || 0
          return (
            <div
              key={key}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs font-bold font-mono" style={{ color: 'var(--text)' }}>{val}</span>
              <span className="text-xs capitalize" style={{ color: 'var(--text-4)' }}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {COLUMNS.map(({ key, label, color }) => {
          const colJobs = jobs.filter(j => j.status === key)
          return (
            <div key={key} className="min-h-[120px]">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>{label}</p>
                <span
                  className="text-xs font-mono px-1 rounded ml-auto"
                  style={{
                    backgroundColor: colJobs.length > 0 ? `${color}20` : 'transparent',
                    color: colJobs.length > 0 ? color : 'var(--text-4)',
                  }}
                >
                  {colJobs.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {colJobs.map(j => (
                  <TrackerCard
                    key={j.job_id}
                    job={j}
                    onStatusChange={onStatusChange}
                    onRemove={onRemove}
                  />
                ))}
                {colJobs.length === 0 && (
                  <div
                    className="h-16 rounded-xl border border-dashed flex items-center justify-center"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="text-xs" style={{ color: 'var(--text-4)', opacity: 0.4 }}>empty</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
