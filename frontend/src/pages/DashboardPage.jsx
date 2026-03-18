import { useEffect } from 'react'
import { useTracker } from '../hooks/useTracker'
import { useGaps } from '../hooks/useGaps'
import TrackerBoard from '../components/dashboard/TrackerBoard'
import DigestPanel from '../components/dashboard/DigestPanel'
import GapChart from '../components/dashboard/GapChart'

function Section({ title, children }) {
  return (
    <section
      className="rounded-xl p-6"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2
        className="text-xs font-mono uppercase tracking-widest mb-5"
        style={{ color: 'var(--text-4)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function SkeletonBlock() {
  return (
    <div
      className="h-32 rounded-lg animate-pulse"
      style={{ backgroundColor: 'var(--bg-3)' }}
    />
  )
}

export default function DashboardPage() {
  const { data: tracker, loading: trackerLoading, updateStatus, remove } = useTracker()
  const { gaps, loading: gapsLoading, fetch: fetchGaps } = useGaps()

  useEffect(() => { fetchGaps() }, [fetchGaps])

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-5 animate-fade-in">
      <h1
        className="text-2xl font-semibold"
        style={{ color: 'var(--text)', fontFamily: '"Instrument Serif", Georgia, serif' }}
      >
        Dashboard
      </h1>

      {/* New Matches */}
      <Section title="New Matches">
        <DigestPanel />
      </Section>

      {/* Gap Analysis */}
      <Section title={`Skill Gap Analysis${gaps ? ` · ${gaps.total_jobs_analyzed} jobs analyzed` : ''}`}>
        {gapsLoading && <SkeletonBlock />}
        {gaps && !gapsLoading && (
          <>
            <GapChart gaps={gaps} />
            {gaps.insight && (
              <div
                className="mt-5 rounded-xl p-4 text-sm"
                style={{
                  backgroundColor: 'rgba(252,170,45,0.07)',
                  border: '1px solid rgba(252,170,45,0.18)',
                  color: 'var(--accent)',
                }}
              >
                💡 {gaps.insight}
              </div>
            )}
          </>
        )}
        {!gaps && !gapsLoading && (
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            Upload your resume and run a search to see gap analysis.
          </p>
        )}
      </Section>

      {/* Application Tracker */}
      <Section title="Application Tracker">
        {trackerLoading ? (
          <SkeletonBlock />
        ) : tracker.jobs.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            Save jobs from search results to start tracking your applications.
          </p>
        ) : (
          <TrackerBoard
            jobs={tracker.jobs}
            stats={tracker.stats}
            onStatusChange={updateStatus}
            onRemove={remove}
          />
        )}
      </Section>
    </div>
  )
}
