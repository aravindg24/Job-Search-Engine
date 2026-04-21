import { useNavigate } from 'react-router-dom'
import PublicNav from '../components/layout/PublicNav'

const steps = [
  {
    number: '01',
    color: '#5B8AF5',
    bg: 'rgba(91,138,245,0.12)',
    title: 'Upload your resume once',
    description:
      'Drop your PDF on the Profile page. Our AI reads every line — skills, projects, work history, education — and stores a structured profile. You never fill out a form again.',
    detail: 'Powered by PyMuPDF text extraction + Gemini structured parsing. Runs in seconds.',
    visual: (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col items-center justify-center py-8 rounded-lg mb-4"
          style={{ backgroundColor: 'var(--surface)', border: '2px dashed var(--border)' }}>
          <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(91,138,245,0.15)', color: '#5B8AF5' }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Drop your PDF here</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>or click to browse</p>
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>resume_aravind.pdf</div>
            <div className="text-xs" style={{ color: 'var(--text-4)' }}>Parsed · 847 skills extracted</div>
          </div>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: '#22c55e18', color: '#22c55e' }}>Done</span>
        </div>
      </div>
    ),
  },
  {
    number: '02',
    color: '#9B66F7',
    bg: 'rgba(155,102,247,0.12)',
    title: 'Search in plain English',
    description:
      'Go to Search and type exactly what you want — no Boolean operators, no keyword tricks. Direct already knows your profile, so a short query like "remote AI startup" is enough to get precise results.',
    detail: 'Your resume context is automatically injected into every query before embedding.',
    visual: (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="mb-3 px-3 py-2.5 rounded-lg flex items-center gap-2"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <svg width="13" height="13" fill="none" stroke="var(--text-4)" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <span className="text-sm" style={{ color: 'var(--text-3)' }}>Bay Area AI companies, Series A–B</span>
          <div className="ml-auto px-3 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'var(--accent)', color: '#000' }}>Search</div>
        </div>
        <div className="space-y-2">
          {[
            'remote AI startup, Series A–B',
            'fintech data engineering, no big tech',
            'remote full-stack with LLM work',
          ].map(q => (
            <div key={q} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
              <svg width="11" height="11" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              {q}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: '03',
    color: '#FCAA2D',
    bg: 'rgba(252,170,45,0.12)',
    title: 'Get AI-ranked matches with explanations',
    description:
      'Results come back ranked by fit, not recency. Each card shows a match score, a one-line reason, and inline skill indicators — so you can scan 20 results in under a minute and focus on the real fits.',
    detail: 'Two-stage retrieval: Qdrant vector search → Cerebras LLM re-ranking with resume context.',
    visual: (
      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        {[
          { pct: 92, title: 'Software Engineer', company: 'Perplexity', reason: 'RAG pipeline maps to their search work.', tags: ['Python ✅', 'LLM ✅', 'Search ✅'] },
          { pct: 84, title: 'Full Stack Engineer', company: 'Vercel', reason: 'React + GCP experience is a direct match.', tags: ['React ✅', 'Node ✅', 'Vue ⚠️'] },
        ].map(job => (
          <div key={job.company} className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{job.title}</div>
                <div className="text-xs" style={{ color: 'var(--text-4)' }}>{job.company}</div>
              </div>
              <span className="text-base font-bold font-mono" style={{ color: job.pct >= 88 ? '#22c55e' : '#FCAA2D' }}>{job.pct}%</span>
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>{job.reason}</p>
            <div className="flex gap-1.5 flex-wrap">
              {job.tags.map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-2)', color: 'var(--text-3)' }}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '04',
    color: '#F06292',
    bg: 'rgba(240,98,146,0.12)',
    title: 'Generate a tailored pitch',
    description:
      'Open any job detail and click "Cover Letter Hook", "Cold Email", or "Why Interested". The AI reads the full JD against your resume and writes a specific, credible pitch — not a template.',
    detail: 'Every pitch includes key mappings (JD requirement ↔ your experience) and framing advice.',
    visual: (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="flex gap-2 mb-4">
          {['Cover letter', 'Cold email', 'Why interested'].map((t, i) => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: i === 0 ? 'var(--accent)' : 'var(--surface)', color: i === 0 ? '#000' : 'var(--text-3)', border: '1px solid var(--border)' }}>
              {t}
            </span>
          ))}
        </div>
        <div className="p-4 rounded-xl mb-4 text-xs leading-relaxed" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
          "Your search ranking team caught my attention — I recently built ConRAC, a retrieval-augmented classification system that uses the same embed-retrieve-rerank pipeline to classify documents across security levels…"
        </div>
        <button className="w-full py-2 rounded-xl text-xs font-medium" style={{ backgroundColor: 'var(--bg-3)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          Copy to clipboard 📋
        </button>
      </div>
    ),
  },
  {
    number: '05',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.12)',
    title: 'Track everything in one place',
    description:
      'Hit "Save" on any job to add it to your tracker. Move cards through Saved → Applied → Interviewing → Offer. Every card keeps its match score, pitch, and your personal notes.',
    detail: 'Dashboard also shows aggregate skill gaps across all your saved roles — a career signal, not just a list.',
    visual: (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[['Saved', 12, 'var(--text-3)'], ['Applied', 8, '#FCAA2D'], ['Interview', 3, '#5B8AF5'], ['Offer', 1, '#34D399']].map(([label, count, color]) => (
            <div key={label} className="text-center px-2 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-lg font-bold font-mono" style={{ color }}>{count}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>{label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[
            { company: 'Perplexity', role: 'SWE', status: 'Interview', color: '#5B8AF5', match: 92 },
            { company: 'Vercel', role: 'Full Stack', status: 'Applied', color: '#FCAA2D', match: 84 },
            { company: 'Ramp', role: 'Backend Eng', status: 'Saved', color: 'var(--text-3)', match: 74 },
          ].map(app => (
            <div key={app.company} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div>
                <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{app.company}</div>
                <div className="text-xs" style={{ color: 'var(--text-4)' }}>{app.role}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: '#22c55e' }}>{app.match}%</span>
                <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-3)', color: app.color }}>{app.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export default function HowItWorksPage() {
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <PublicNav />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="px-6 md:px-16 pt-20 pb-14 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-8"
          style={{ backgroundColor: 'rgba(252,170,45,0.12)', color: 'var(--accent)', border: '1px solid rgba(252,170,45,0.25)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Five steps · Under two minutes to first results
        </div>
        <h1 className="font-serif text-5xl md:text-6xl leading-tight mb-5 text-[var(--text)]">
          Five steps from<br />
          <span style={{ color: 'var(--accent)' }}>upload to offer</span>
        </h1>
        <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
          style={{ color: 'var(--text-3)' }}>
          Direct is designed to get out of your way. Upload your resume once,
          describe what you want, and let the AI do the heavy lifting.
        </p>
      </section>

      {/* ── Steps ─────────────────────────────────────────── */}
      <section className="px-6 md:px-16 pb-24 max-w-7xl mx-auto">
        {/* Timeline connector (desktop) */}
        <div className="relative">
          <div className="space-y-20">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
              >
                {/* Text — alternates side */}
                <div className={i % 2 === 1 ? 'order-1 lg:order-2' : ''}>
                  {/* Step number pill */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-mono"
                      style={{ backgroundColor: step.bg, color: step.color }}
                    >
                      {step.number}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="hidden lg:flex items-center gap-1.5">
                        <div className="h-px w-8" style={{ backgroundColor: 'var(--border)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-4)' }}>then</span>
                      </div>
                    )}
                  </div>

                  <h2 className="font-serif text-2xl md:text-3xl mb-3 text-[var(--text)]">
                    {step.title}
                  </h2>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-3)' }}>
                    {step.description}
                  </p>
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: step.bg, color: step.color, display: 'inline-block' }}>
                    ⚡ {step.detail}
                  </p>
                </div>

                {/* Visual — alternates side */}
                <div className={i % 2 === 1 ? 'order-2 lg:order-1' : ''}>
                  {step.visual}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ strip ─────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-16 max-w-5xl mx-auto">
        <h2 className="font-serif text-2xl md:text-3xl mb-8 text-center text-[var(--text)]">
          Common questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { q: 'Do I need to re-upload my resume for each search?', a: 'No. Your resume is parsed once and stored. Every search automatically uses your profile.' },
            { q: 'Where do the jobs come from?', a: 'We scrape SimplifyJobs, Remotive, Arbeitnow, and Hacker News Who\'s Hiring daily. Index refreshed every morning.' },
            { q: 'How is this different from LinkedIn or Indeed?', a: 'Those search by keyword. Direct searches by meaning — and already knows who you are before you type anything.' },
            { q: 'Is my resume data private?', a: 'Yes. Your profile is scoped to your account and never shared. Built multi-user from day one.' },
          ].map(faq => (
            <div key={faq.q} className="p-5 rounded-xl"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>{faq.q}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-24 text-center">
        <div className="max-w-xl mx-auto p-10 rounded-2xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-serif text-3xl md:text-4xl mb-4 text-[var(--text)]">
            Ready to try it?
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-3)' }}>
            Upload your resume and see your first matches in under two minutes. Free, no card required.
          </p>
          <button
            onClick={() => navigate('/login', { state: { mode: 'signup' } })}
            className="text-sm px-8 py-3 rounded-xl font-semibold transition-all duration-150 hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
          >
            Get started free →
          </button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="px-6 md:px-16 py-8 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}>D</div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>Direct</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-4)' }}>
          Built with FastAPI · Qdrant · Cerebras · Supabase · React
        </p>
      </footer>
    </div>
  )
}
