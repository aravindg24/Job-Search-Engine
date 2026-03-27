import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

const steps = [
  {
    number: '01',
    title: 'Upload your resume once',
    description: 'Drop your PDF and our AI parses it into a structured profile — skills, projects, experience, education. You never fill out a form again.',
  },
  {
    number: '02',
    title: 'Search in plain English',
    description: 'Type what you actually want: "remote AI startup, Series A-B" or "fintech data engineering, no big tech". We already know who you are.',
  },
  {
    number: '03',
    title: 'Get ranked matches with explanations',
    description: 'Every result comes with a match score, a one-line reason why it fits, and an honest breakdown of your strengths and gaps against that specific role.',
  },
  {
    number: '04',
    title: 'Generate a tailored pitch',
    description: 'One click generates a cover letter hook, cold email, or interview answer that maps your exact projects to that job\'s exact requirements.',
  },
  {
    number: '05',
    title: 'Track everything in one place',
    description: 'Save roles, mark as applied, move through interview stages. See aggregate skill gaps across all your top matches so you know what to learn next.',
  },
]

const features = [
  {
    icon: '⚡',
    title: 'Semantic search, not keywords',
    description: '"Software Engineer" at an AI company shows up when you search "ML Engineer" — because we match meaning, not words.',
  },
  {
    icon: '🎯',
    title: 'Know fit before you apply',
    description: 'Instant match score + strengths/gaps before you spend 45 minutes tailoring a cover letter for a role you\'re underqualified for.',
  },
  {
    icon: '✍️',
    title: 'Pitches that cite your work',
    description: 'Not generic. Every sentence references a specific project from your resume mapped to a specific requirement in the job description.',
  },
  {
    icon: '📊',
    title: 'Strategic skill gap analysis',
    description: 'If 8 of your top 15 matches want Kubernetes and you don\'t have it, that\'s a career signal — not just a missing keyword.',
  },
  {
    icon: '🔔',
    title: 'Live job index, updated daily',
    description: 'Pulls fresh roles from SimplifyJobs, Remotive, Arbeitnow, and HN Who\'s Hiring every morning. No more manual refreshing.',
  },
  {
    icon: '🔒',
    title: 'Your data, your account',
    description: 'Multi-user from day one. Your resume, tracker, and preferences are completely private and scoped to your account.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}>
            D
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text)' }}>Direct</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            {dark ? (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>

          <button
            onClick={() => navigate('/login')}
            className="text-sm px-4 py-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/login', { state: { mode: 'signup' } })}
            className="text-sm px-4 py-2 rounded-lg font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Get started free
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 pt-24 pb-20 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-8"
          style={{
            backgroundColor: 'rgba(252,170,45,0.12)',
            color: 'var(--accent)',
            border: '1px solid rgba(252,170,45,0.25)',
          }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Live job index · Updated daily
        </div>

        <h1 className="text-5xl md:text-6xl leading-tight mb-6"
          style={{ fontFamily: 'Instrument Serif, serif', color: 'var(--text)' }}>
          Find roles by fit,<br />
          <span style={{ color: 'var(--accent)' }}>not keywords.</span>
        </h1>

        <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
          style={{ color: 'var(--text-3)' }}>
          Upload your resume once. Search in plain English. Get AI-ranked matches
          with explanations, tailored pitches, and gap analysis — before you apply.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/login', { state: { mode: 'signup' } })}
            className="text-sm px-6 py-3 rounded-lg font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Start searching free →
          </button>
          <a
            href="https://github.com/aravindg24/Job-Search-Engine"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-6 py-3 rounded-lg transition-all duration-150"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-3)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: 'var(--accent)' }}>
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'Instrument Serif, serif', color: 'var(--text)' }}>
            Five steps from upload to offer
          </h2>
        </div>

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="flex gap-6 p-6 rounded-xl transition-all duration-150"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(252,170,45,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div className="shrink-0 text-sm font-mono font-bold mt-0.5"
                style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                {step.number}
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1.5" style={{ color: 'var(--text)' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ───────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: 'var(--accent)' }}>
            Why Direct
          </p>
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'Instrument Serif, serif', color: 'var(--text)' }}>
            Everything your job search needs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div
              key={f.title}
              className="p-5 rounded-xl"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text)' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-24 text-center">
        <div className="max-w-xl mx-auto p-10 rounded-2xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-3xl md:text-4xl mb-4"
            style={{ fontFamily: 'Instrument Serif, serif', color: 'var(--text)' }}>
            Ready to search smarter?
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-3)' }}>
            Upload your resume, describe what you want, and get ranked matches in seconds.
            No credit card required.
          </p>
          <button
            onClick={() => navigate('/login', { state: { mode: 'signup' } })}
            className="text-sm px-8 py-3 rounded-lg font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Create your free account →
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="px-6 md:px-12 py-8 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}>D</div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>Direct</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-4)' }}>
          Built with FastAPI · Qdrant · Cerebras · Supabase · React
        </p>
        <a
          href="https://github.com/aravindg24/Job-Search-Engine"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs transition-colors"
          style={{ color: 'var(--text-4)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
        >
          GitHub →
        </a>
      </footer>

    </div>
  )
}
