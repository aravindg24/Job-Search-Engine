import { statusColor } from '../../utils/colors'
import { timeAgo } from '../../utils/format'
import MatchBadge from '../shared/MatchBadge'

const COLUMNS = ['saved', 'applied', 'interviewing', 'offered', 'rejected']

function TrackerCard({ job, onStatusChange, onRemove }) {
  return (
    <div className="bg-zinc-900 border border-border rounded-lg p-3 text-sm">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="text-primary font-medium truncate">{job.job_title || 'Unknown role'}</p>
          <p className="text-secondary text-xs truncate">{job.company}</p>
        </div>
        <MatchBadge score={job.match_score} />
      </div>

      {job.updated_at && (
        <p className="text-xs text-zinc-600 mb-2">{timeAgo(job.updated_at)}</p>
      )}

      {job.notes && (
        <p className="text-xs text-zinc-500 italic mb-2 truncate">{job.notes}</p>
      )}

      <div className="flex items-center gap-1.5 mt-2">
        <select
          value={job.status}
          onChange={e => onStatusChange(job.job_id, e.target.value)}
          className="text-xs bg-zinc-800 border border-border rounded px-1.5 py-1 text-secondary flex-1 focus:outline-none"
        >
          {COLUMNS.map(s => <option key={s} value={s}>{s}</option>)}
          <option value="withdrawn">withdrawn</option>
        </select>
        <button
          onClick={() => onRemove(job.job_id)}
          className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-1"
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function TrackerBoard({ jobs, stats, onStatusChange, onRemove }) {
  return (
    <div>
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 mb-5 text-sm">
        {Object.entries(stats || {}).map(([key, val]) => val > 0 && (
          <div key={key} className="text-center">
            <p className="font-mono text-primary font-bold">{val}</p>
            <p className="text-secondary text-xs capitalize">{key}</p>
          </div>
        ))}
      </div>

      {/* Columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {COLUMNS.map(col => {
          const colJobs = jobs.filter(j => j.status === col)
          return (
            <div key={col} className="min-h-[120px]">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs uppercase tracking-wider text-secondary capitalize">{col}</p>
                <span className="text-xs font-mono text-zinc-600">({colJobs.length})</span>
              </div>
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
                  <div className="h-16 border border-dashed border-zinc-800 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-zinc-700">empty</span>
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
