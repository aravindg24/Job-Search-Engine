import { useState, useEffect } from 'react'
import { explainMatch } from '../utils/api'
import MatchBadge from './MatchBadge'
import TagPill from './TagPill'

function MatchBar({ score }) {
  const pct = Math.round(score ?? 0)
  let barColor = 'bg-match-red'
  if (pct >= 80) barColor = 'bg-match-green'
  else if (pct >= 60) barColor = 'bg-match-yellow'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-sm font-medium text-text-primary w-16 text-right">
        {pct}% match
      </span>
    </div>
  )
}

export default function JobDetail({ job, query, onClose }) {
  const [explain, setExplain] = useState(null)
  const [loadingExplain, setLoadingExplain] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!job || !query) return
    setExplain(null)
    setLoadingExplain(true)
    explainMatch({ query, job_id: job.id })
      .then(data => setExplain(data))
      .catch(() => setExplain(null))
      .finally(() => setLoadingExplain(false))
  }, [job?.id, query])

  if (!job) return null

  function handleCopy() {
    const text = [
      `${job.title} — ${job.company}`,
      `Match: ${Math.round(job.match_score ?? 0)}%`,
      job.match_reason ? `Why: "${job.match_reason}"` : '',
      explain?.strengths?.length ? `Strengths: ${explain.strengths.join('; ')}` : '',
      explain?.gaps?.length ? `Gaps: ${explain.gaps.join('; ')}` : '',
      explain?.suggestion ? `Tip: ${explain.suggestion}` : '',
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-bg border-l border-border h-full overflow-y-auto animate-slide-right z-10">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="text-xs text-text-secondary hover:text-text-primary border border-border hover:border-accent/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy Summary'}
              </button>
              {job.source_url && (
                <a
                  href={job.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-accent text-bg font-semibold px-3 py-1.5 rounded-lg hover:bg-accent-hover transition-colors"
                >
                  Apply →
                </a>
              )}
            </div>
          </div>

          {/* Job title */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-text-secondary text-sm">{job.company}</span>
              {job.remote && (
                <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded font-mono">
                  Remote
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl text-text-primary leading-tight">{job.title}</h2>
            <p className="text-text-secondary text-sm mt-1">
              {job.location}
              {job.salary_range && <span> · {job.salary_range}</span>}
              {job.company_stage && <span> · {job.company_stage}</span>}
            </p>
          </div>

          {/* Match bar */}
          <div className="mb-6">
            <MatchBar score={explain?.match_score ?? job.match_score} />
          </div>

          {/* Why you match */}
          {(explain || loadingExplain) && (
            <section className="mb-5">
              <h3 className="text-xs font-mono text-text-secondary uppercase tracking-widest mb-3">
                Why you match
              </h3>
              {loadingExplain ? (
                <div className="space-y-2 animate-pulse">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-4 bg-surface rounded w-3/4" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {explain?.strengths?.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-text-primary">
                      <span className="text-match-green mt-0.5">✓</span>
                      {s}
                    </div>
                  ))}
                  {explain?.gaps?.map((g, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-match-yellow mt-0.5">⚠</span>
                      {g}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Suggestion */}
          {explain?.suggestion && (
            <section className="mb-5 bg-surface rounded-xl p-4 border border-border">
              <h3 className="text-xs font-mono text-text-secondary uppercase tracking-widest mb-2">
                Suggestion
              </h3>
              <p className="text-sm text-text-primary leading-relaxed italic">
                "{explain.suggestion}"
              </p>
            </section>
          )}

          {/* Tags */}
          <section className="mb-5">
            <h3 className="text-xs font-mono text-text-secondary uppercase tracking-widest mb-2">
              Skills & Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...(job.requirements || []), ...(job.tags || [])])].map(tag => (
                <TagPill key={tag} tag={tag} />
              ))}
            </div>
          </section>

          <hr className="border-border mb-5" />

          {/* Full description */}
          <section>
            <h3 className="text-xs font-mono text-text-secondary uppercase tracking-widest mb-3">
              Full Description
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
