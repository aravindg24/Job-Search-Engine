import MatchBadge from './MatchBadge'
import TagPill from './TagPill'

export default function ResultCard({ job, index, onSelect }) {
  const stagger = Math.min(index, 5)

  return (
    <button
      onClick={() => onSelect(job)}
      className={`
        w-full text-left bg-surface border border-border rounded-xl p-5
        card-hover animate-slide-up opacity-0 stagger-${stagger}
        cursor-pointer
      `}
      style={{ animationFillMode: 'forwards', animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-text-secondary text-sm">{job.company}</span>
            {job.remote && (
              <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded font-mono">
                Remote
              </span>
            )}
            {job.company_stage && (
              <span className="text-xs text-text-secondary border border-border px-1.5 py-0.5 rounded font-mono">
                {job.company_stage}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-text-primary text-base leading-snug truncate">
            {job.title}
          </h3>
          <p className="text-text-secondary text-sm mt-0.5">
            {job.location}
            {job.salary_range && <span> · {job.salary_range}</span>}
          </p>
        </div>
        <div className="shrink-0">
          <MatchBadge score={job.match_score} />
        </div>
      </div>

      {job.match_reason && (
        <p className="text-text-secondary text-sm leading-relaxed mb-3 line-clamp-2 italic">
          "{job.match_reason}"
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(job.requirements || job.tags || []).slice(0, 4).map(tag => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
        <span className="text-accent text-sm font-medium shrink-0 ml-2">
          Details →
        </span>
      </div>
    </button>
  )
}
