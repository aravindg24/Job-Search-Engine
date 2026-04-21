import { useNavigate } from 'react-router-dom'
import PublicNav from '../components/layout/PublicNav'

const stats = [
  {
    value: '10K+',
    label: 'Live jobs indexed',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    value: 'Daily',
    label: 'Fresh jobs every morning',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
      </svg>
    ),
  },
  {
    value: 'Semantic',
    label: 'AI-powered matching engine',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
      </svg>
    ),
  },
]

const sampleJobs = [
  { rank: 1, title: 'Software Engineer', company: 'Perplexity', location: 'SF · Remote', match: 92, trend: '+3%', positive: true },
  { rank: 2, title: 'ML Engineer', company: 'Anthropic', location: 'San Francisco', match: 88, trend: '+1%', positive: true },
  { rank: 3, title: 'Full Stack Engineer', company: 'Vercel', location: 'Remote', match: 84, trend: '+5%', positive: true },
  { rank: 4, title: 'AI Engineer', company: 'Linear', location: 'San Francisco', match: 79, trend: '-2%', positive: false },
  { rank: 5, title: 'Backend Engineer', company: 'Ramp', location: 'NY · Remote', match: 74, trend: '+2%', positive: true },
  { rank: 6, title: 'Senior Engineer', company: 'Modal', location: 'Remote', match: 71, trend: '+4%', positive: true },
]

const coreFeatures = [
  {
    label: 'Resume parsing',
    color: '#5B8AF5',
    bg: 'rgba(91,138,245,0.14)',
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
  },
  {
    label: 'Semantic search',
    color: '#9B66F7',
    bg: 'rgba(155,102,247,0.14)',
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
        <path d="M8 11a3 3 0 013-3"/>
      </svg>
    ),
  },
  {
    label: 'Pitch generator',
    color: '#FCAA2D',
    bg: 'rgba(252,170,45,0.14)',
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    label: 'Gap analysis',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.14)',
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
]

function MatchBar({ pct }) {
  const color = pct >= 85 ? '#22c55e' : pct >= 70 ? '#FCAA2D' : '#71717a'
  return (
    <div style={{ width: 64, height: 5, borderRadius: 9999, backgroundColor: 'var(--bg-3)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 9999, backgroundColor: color }} />
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>

      <PublicNav />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 pt-20 pb-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            <p className="text-sm font-medium mb-5" style={{ color: 'var(--text-4)' }}>
              Secure, simple, seamless
            </p>
            <h1 className="text-5xl md:text-6xl leading-tight mb-6"
              className="font-serif text-[var(--text)]">
              <span style={{ color: 'var(--accent)' }}>Fast-track</span><br />
              your job search
            </h1>
            <p className="text-base md:text-lg leading-relaxed mb-8 max-w-md"
              style={{ color: 'var(--text-3)' }}>
              Upload your resume once. Describe what you want in plain English.
              Get AI-ranked matches with explanations, tailored pitches, and gap analysis.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                className="text-sm px-6 py-3 rounded-xl font-semibold transition-all duration-150"
                style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Start searching free →
              </button>
              <button onClick={() => navigate('/login')}
                className="text-sm px-6 py-3 rounded-xl transition-all duration-150"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                Sign in
              </button>
            </div>
          </div>

          {/* Right — mock search UI card */}
          <div className="relative">
            {/* Decorative background bars */}
            <div className="absolute inset-0 flex items-end justify-end pb-4 pr-4 pointer-events-none overflow-hidden rounded-2xl" style={{ opacity: 0.15 }}>
              {[40, 60, 45, 75, 55, 85, 65, 90, 70, 80].map((h, i) => (
                <div key={i} className="mx-0.5 rounded-t-sm" style={{ width: 14, height: `${h}%`, backgroundColor: 'var(--accent)' }} />
              ))}
            </div>

            <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 40px var(--shadow-lg)' }}>
              {/* Search input mock */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
                style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <svg width="14" height="14" fill="none" stroke="var(--text-4)" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <span className="text-sm" style={{ color: 'var(--text-3)' }}>remote AI startup, Series A–B</span>
                <div className="ml-auto px-3 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'var(--accent)', color: '#000' }}>
                  Search
                </div>
              </div>

              {/* Result rows */}
              <div className="text-xs font-medium mb-3 flex items-center justify-between" style={{ color: 'var(--text-4)' }}>
                <span>24 matches found</span>
                <span style={{ color: 'var(--accent)' }}>Gap Analysis ↗</span>
              </div>

              {[
                { pct: 92, color: '#22c55e', title: 'Software Engineer', company: 'Perplexity', tags: ['Python', 'LLM', 'Search'] },
                { pct: 88, color: '#22c55e', title: 'ML Engineer', company: 'Anthropic', tags: ['PyTorch', 'RLHF', 'LLM'] },
                { pct: 79, color: '#FCAA2D', title: 'AI Engineer', company: 'Linear', tags: ['React', 'TypeScript'] },
              ].map((job, i) => (
                <div key={i} className="flex items-start gap-3 py-3"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{ backgroundColor: `${job.color}18`, color: job.color }}>
                    {job.pct}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{job.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{job.company}</div>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {job.tags.map(t => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded-md"
                          style={{ backgroundColor: 'var(--bg-2)', color: 'var(--text-3)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <button className="shrink-0 text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-3)', color: 'var(--text-3)' }}>
                    Save
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-center gap-4 px-8 py-6"
              style={{ borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                {s.icon}
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>{s.value}</div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature A — Search in plain English ──────────────────── */}
      <section className="px-6 md:px-16 py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>
              Smart search
            </p>
            <h2 className="text-3xl md:text-4xl mb-5" className="font-serif text-[var(--text)]">
              Search in plain English,<br />not keywords
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-3)' }}>
              Type what you actually want: <em>"remote AI startup, Series A–B"</em> or{' '}
              <em>"fintech data engineering, no big tech"</em>. Direct already knows who you are
              from your resume — short queries work beautifully.
            </p>
            <ul className="space-y-3">
              {[
                'Semantic matching — finds roles by meaning, not exact words',
                '"Software Engineer" at AI co appears for "ML Engineer" searches',
                'Resume profile auto-enriches every query you type',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-3)' }}>
                  <span className="mt-0.5 shrink-0 text-base" style={{ color: 'var(--accent)' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — query examples card */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 24px var(--shadow)' }}>
            <div className="text-xs font-medium mb-4" style={{ color: 'var(--text-4)' }}>Try searching for</div>
            {[
              { query: 'fintech data engineering, no big tech', results: 18 },
              { query: 'Bay Area AI companies, Series A–B', results: 31 },
              { query: 'remote full-stack with LLM work', results: 24 },
            ].map((ex, i) => (
              <div key={i} className="flex items-center justify-between py-3"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: 'var(--accent-light)' }}>
                    <svg width="10" height="10" fill="none" stroke="var(--accent)" strokeWidth="2.5" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-2)' }}>{ex.query}</span>
                </div>
                <span className="text-xs font-mono shrink-0 ml-3" style={{ color: 'var(--text-4)' }}>{ex.results} matches</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature B — Know your fit ────────────────────────────── */}
      <section className="px-6 md:px-16 py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — gap analysis visual */}
          <div className="rounded-2xl p-6 order-2 lg:order-1" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 24px var(--shadow)' }}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Portfolio overview</span>
              <span className="text-xs" style={{ color: 'var(--accent)' }}>View all</span>
            </div>
            {[
              { skill: 'Python', pct: 93, have: true },
              { skill: 'React', pct: 73, have: true },
              { skill: 'LLM / RAG', pct: 60, have: true },
              { skill: 'Kubernetes', pct: 53, have: false },
              { skill: 'Go / Golang', pct: 40, have: false },
            ].map((row, i) => (
              <div key={row.skill} className="flex items-center gap-4 py-2.5"
                style={{ borderTop: i > 0 ? '1px solid var(--border-2)' : 'none' }}>
                <div className="w-20 shrink-0 text-sm" style={{ color: row.have ? 'var(--text-2)' : 'var(--text-4)' }}>{row.skill}</div>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-3)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${row.pct}%`, backgroundColor: row.have ? '#22c55e' : '#FCAA2D' }} />
                </div>
                <div className="w-8 text-right text-xs font-mono" style={{ color: 'var(--text-4)' }}>{row.pct}%</div>
                <div className="w-4 text-center text-xs">{row.have ? '✅' : '⚠️'}</div>
              </div>
            ))}
            <div className="mt-4 px-4 py-3 rounded-xl text-xs leading-relaxed"
              style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-dark)' }}>
              💡 Adding Kubernetes would unlock 8 more strong-fit roles.
            </div>
          </div>

          {/* Right — copy */}
          <div className="order-1 lg:order-2">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>
              Portfolio overview
            </p>
            <h2 className="text-3xl md:text-4xl mb-5" className="font-serif text-[var(--text)]">
              Know your fit<br />before you apply
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-3)' }}>
              Track your total holdings, profitloss, individual crypto performance, portfolio growth,
              trends, and analytics — but for your career. Instant match score + strengths/gaps so
              you never waste 45 minutes on a role you're underqualified for.
            </p>
            <ul className="space-y-3">
              {[
                'Match score 0–100 for every job against your exact profile',
                'See what\'s missing and how severe the gap really is',
                'Strategic insight: which skills to learn for the most unlocks',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-3)' }}>
                  <span className="mt-0.5 shrink-0 text-base" style={{ color: 'var(--accent)' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Top matches table ────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>Live index</p>
          <h2 className="text-3xl md:text-4xl" className="font-serif text-[var(--text)]">
            Top matches
          </h2>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          {/* Table header */}
          <div className="grid grid-cols-12 px-6 py-3 text-xs font-semibold tracking-wide uppercase"
            style={{ backgroundColor: 'var(--bg-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-4)' }}>
            <div className="col-span-1">#</div>
            <div className="col-span-4">Role</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-2">Match</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-1 text-right">7 days</div>
          </div>

          {/* Table rows */}
          {sampleJobs.map((job, i) => (
            <div key={job.rank} className="grid grid-cols-12 px-6 py-4 items-center transition-colors duration-100"
              style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div className="col-span-1 text-sm font-mono" style={{ color: 'var(--text-4)' }}>{job.rank}</div>
              <div className="col-span-4">
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{job.title}</div>
              </div>
              <div className="col-span-2 text-sm" style={{ color: 'var(--text-3)' }}>{job.company}</div>
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <MatchBar pct={job.match} />
                  <span className="text-xs font-mono" style={{ color: job.match >= 85 ? '#22c55e' : job.match >= 70 ? '#FCAA2D' : 'var(--text-4)' }}>
                    {job.match}%
                  </span>
                </div>
              </div>
              <div className="col-span-2 text-xs" style={{ color: 'var(--text-4)' }}>{job.location}</div>
              <div className="col-span-1 text-right text-xs font-mono" style={{ color: job.positive ? '#22c55e' : '#ef4444' }}>
                {job.trend}
              </div>
            </div>
          ))}

          {/* Footer row */}
          <div className="px-6 py-4 text-center" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-2)' }}>
            <button onClick={() => navigate('/login', { state: { mode: 'signup' } })}
              className="text-sm font-medium transition-colors"
              style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Upload your resume to see your real matches →
            </button>
          </div>
        </div>
      </section>

      {/* ── Core features icons ──────────────────────────────────── */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto text-center">
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>
          Everything you need
        </p>
        <h2 className="text-3xl md:text-4xl mb-4" className="font-serif text-[var(--text)]">
          Multi-feature support
        </h2>
        <p className="text-sm mb-14 max-w-md mx-auto" style={{ color: 'var(--text-3)' }}>
          From upload to offer — every tool you need for a smarter job search, in one place.
        </p>
        <div className="flex items-start justify-center gap-10 flex-wrap">
          {coreFeatures.map(f => (
            <div key={f.label} className="flex flex-col items-center gap-4" style={{ width: 110 }}>
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-200"
                style={{
                  backgroundColor: f.bg,
                  border: `1px solid ${f.color}30`,
                  color: f.color,
                  boxShadow: `0 4px 20px ${f.color}18`,
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {f.icon}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust cards ──────────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>Why Direct</p>
          <h2 className="text-3xl md:text-4xl" className="font-serif text-[var(--text)]">
            Your career, our priority
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1 */}
          <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Tailored pitches that cite your work</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-3)' }}>
              One click generates a cover letter hook, cold email, or interview answer that maps
              your exact projects to that job's exact requirements. Not generic — every sentence
              references something real from your resume.
            </p>
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
              <div className="flex gap-2 mb-2">
                {['Cover letter', 'Cold email', 'Why interested'].map(t => (
                  <span key={t} className="text-xs px-2 py-1 rounded-md"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>{t}</span>
                ))}
              </div>
              <p className="text-xs leading-relaxed italic" style={{ color: 'var(--text-3)' }}>
                "Your search ranking team caught my attention — I recently built ConRAC, a retrieval-augmented
                classification system using the same embed-retrieve-rerank pipeline…"
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Your data, your account</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-3)' }}>
              Multi-user from day one. Your resume, tracker, and preferences are completely private
              and scoped to your account. Recover access anytime — your job search command center
              is always waiting for you.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '🔐', label: 'Private profile', sub: 'Scoped to your account' },
                { icon: '💾', label: 'Persistent tracker', sub: 'Never lose your progress' },
                { icon: '📋', label: 'Resume parsing', sub: 'Upload once, search forever' },
                { icon: '🔔', label: 'Daily digest', sub: 'New matches every morning' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                  <div className="text-lg mb-1">{item.icon}</div>
                  <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{item.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-24 text-center max-w-7xl mx-auto">
        <div className="relative rounded-3xl p-16 overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          {/* Background decoration */}
          <div className="absolute bottom-0 right-0 flex items-end gap-0.5 pb-0 pr-8 pointer-events-none" style={{ opacity: 0.12 }}>
            {[30, 50, 40, 65, 55, 80, 60, 90, 70, 85, 75, 95].map((h, i) => (
              <div key={i} className="rounded-t-sm w-3" style={{ height: `${h * 1.2}px`, backgroundColor: 'var(--accent)' }} />
            ))}
          </div>

          <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-4)' }}>
            Simplify your job search with Direct
          </p>
          <h2 className="text-4xl md:text-5xl mb-3 relative z-10"
            className="font-serif text-[var(--text)]">
            <span style={{ color: 'var(--accent)' }}>Kickstart</span> your job<br />search today
          </h2>
          <p className="text-sm mb-8 relative z-10" style={{ color: 'var(--text-3)' }}>
            Upload your resume, describe what you want, and get ranked matches in seconds.
            No credit card required.
          </p>
          <button
            onClick={() => navigate('/login', { state: { mode: 'signup' } })}
            className="relative z-10 text-sm px-8 py-3 rounded-xl font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Get the app →
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="px-6 md:px-16 py-12" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: 'var(--accent)', color: '#000' }}>D</div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Direct</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-4)' }}>
              Fast-track your job search, at your fingertips.
            </p>
            <p className="text-xs mt-4" style={{ color: 'var(--text-4)' }}>
              © Blockio. All Rights Reserved © 2025
            </p>
          </div>

          {/* Links */}
          {[
            { heading: 'App', links: ['Search', 'Dashboard', 'Profile'] },
            { heading: 'Need a minute', links: ['Contact Us', 'Blog'] },
            { heading: 'Community', links: ['LinkedIn', 'Twitter'] },
          ].map(col => (
            <div key={col.heading}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-4)' }}>
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <button className="text-sm transition-colors"
                      style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>

    </div>
  )
}
