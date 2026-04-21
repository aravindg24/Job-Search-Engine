import { useEffect } from 'react'
import { useTracker } from '../hooks/useTracker'
import { useGaps } from '../hooks/useGaps'
import TrackerBoard from '../components/dashboard/TrackerBoard'
import DigestPanel from '../components/dashboard/DigestPanel'
import GapChart from '../components/dashboard/GapChart'

function SectionHeader({ label, count, sub }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {/* Accent bar */}
        <span
          className="w-1 h-5 rounded-full shrink-0"
          style={{ backgroundColor: 'var(--accent)' }}
        />
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>{label}</h2>
          {sub && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>{sub}</p>
          )}
        </div>
      </div>
      {count !== undefined && (
        <span
          className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg"
          style={{
            backgroundColor: 'rgba(232,255,71,0.1)',
            color: 'var(--accent)',
            border: '1px solid rgba(232,255,71,0.2)',
          }}
        >
          {count}
        </span>
      )}
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {children}
    </div>
  )
}

function SkeletonBlock({ h = 'h-32' }) {
  return (
    <div
      className={`${h} rounded-xl animate-pulse`}
      style={{ backgroundColor: 'var(--bg-3)' }}
    />
  )
}

export default function DashboardPage() {
  const { data: tracker, loading: trackerLoading, updateStatus, remove } = useTracker()
  const { gaps, loading: gapsLoading, fetch: fetchGaps } = useGaps()

  useEffect(() => { fetchGaps() }, [fetchGaps])

  const totalTracked  = tracker.jobs.length
  const activeCount   = (tracker.stats?.saved || 0) + (tracker.stats?.applied || 0) + (tracker.stats?.interviewing || 0)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">

      {/* Page title */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold">
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-4)' }}>
          Your job search at a glance
        </p>
      </div>

      {/* ── Top row: New Matches (left) + Skill Gaps (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">

        {/* New Matches — wider */}
        <Card className="lg:col-span-3">
          <SectionHeader
            label="New Matches"
            sub="Jobs that fit your profile, updated hourly"
          />
          <DigestPanel />
        </Card>

        {/* Skill Gap Analysis — narrower */}
        <Card className="lg:col-span-2">
          <SectionHeader
            label="Skill Gaps"
            sub={gaps ? `Based on ${gaps.total_jobs_analyzed} jobs analyzed` : 'Upload resume to see gaps'}
          />
          {gapsLoading && <SkeletonBlock />}
          {gaps && !gapsLoading && (
            <>
              <GapChart gaps={gaps} />
              {gaps.insight && (
                <div
                  className="mt-4 rounded-xl p-3 text-xs leading-relaxed"
                  style={{
                    backgroundColor: 'rgba(232,255,71,0.06)',
                    border: '1px solid rgba(232,255,71,0.15)',
                    color: 'var(--accent)',
                  }}
                >
                  💡 {gaps.insight}
                </div>
              )}
            </>
          )}
          {!gaps && !gapsLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-3xl opacity-30">📊</span>
              <p className="text-xs text-center" style={{ color: 'var(--text-4)' }}>
                Upload your resume and run a search<br />to see your skill gap analysis.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Application Tracker — full width ── */}
      <Card>
        <SectionHeader
          label="Application Tracker"
          count={totalTracked > 0 ? `${activeCount} active` : undefined}
          sub="Track every application from saved to offer"
        />
        {trackerLoading ? (
          <SkeletonBlock h="h-40" />
        ) : tracker.jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-3xl opacity-30">📋</span>
            <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>No applications tracked yet</p>
            <p className="text-xs" style={{ color: 'var(--text-4)' }}>
              Save jobs from search results to start tracking your applications.
            </p>
          </div>
        ) : (
          <TrackerBoard
            jobs={tracker.jobs}
            stats={tracker.stats}
            onStatusChange={updateStatus}
            onRemove={remove}
          />
        )}
      </Card>

    </div>
  )
}
