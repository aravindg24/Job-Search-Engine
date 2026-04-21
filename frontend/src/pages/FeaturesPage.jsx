import { useNavigate } from 'react-router-dom'
import PublicNav from '../components/layout/PublicNav'

const features = [
  {
    color: '#5B8AF5',
    bg: 'rgba(91,138,245,0.12)',
    number: '01',
    title: 'Resume Parsing',
    tagline: 'Upload once. Never fill a form again.',
    description:
      'Drop your PDF and our AI extracts your skills, projects, experience, and education into a structured profile. Every search you run is automatically enriched with who you are.',
    points: [
      'Skills auto-categorized: languages, frameworks, ML/AI, cloud',
      'Projects parsed with tech stack and one-line descriptions',
      'Work history + education extracted and stored',
      'Re-upload anytime — profile updates instantly',
    ],
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
    visual: (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(91,138,245,0.15)', color: '#5B8AF5' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>resume_aravind.pdf</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: '#22c55e18', color: '#22c55e' }}>Parsed ✓</span>
        </div>
        {[
          { label: 'Skills', value: 'Python, React, PyTorch, RAG, Qdrant, Docker…' },
          { label: 'Projects', value: 'ConRAC, Resolve AI, Medical RAG, CV Framework' },
          { label: 'Experience', value: '2 years · Hitachi Vantara (SWE)' },
          { label: 'Education', value: 'MS CS · SJSU · 2025' },
        ].map(row => (
          <div key={row.label} className="flex gap-3 py-2" style={{ borderBottom: '1px solid var(--border-2)' }}>
            <span className="text-xs w-20 shrink-0" style={{ color: 'var(--text-4)' }}>{row.label}</span>
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>{row.value}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    color: '#9B66F7',
    bg: 'rgba(155,102,247,0.12)',
    number: '02',
    title: 'Semantic Search',
    tagline: 'Find roles by meaning, not exact keywords.',
    description:
      'Type what you actually want in plain English. Our AI embeds your query alongside your resume context and finds roles by semantic similarity — surfacing matches you\'d miss with keyword search.',
    points: [
      '"ML Engineer" searches surface "Software Engineer" roles at AI companies',
      'Short queries work — Direct already knows your full profile',
      'Filter by remote, location, company stage without losing relevance',
      'Powered by BAAI/bge embeddings + Qdrant vector search',
    ],
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
        <path d="M8 11a3 3 0 013-3"/>
      </svg>
    ),
    visual: (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <svg width="13" height="13" fill="none" stroke="var(--text-4)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <span className="text-sm" style={{ color: 'var(--text-3)' }}>remote AI startup, Series A–B</span>
        </div>
        <div className="space-y-2">
          {[
            { title: 'Software Engineer', company: 'Perplexity', match: 92 },
            { title: 'ML Engineer', company: 'Anthropic', match: 88 },
            { title: 'AI Engineer', company: 'Linear', match: 79 },
          ].map(job => (
            <div key={job.company} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div>
                <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{job.title}</div>
                <div className="text-xs" style={{ color: 'var(--text-4)' }}>{job.company}</div>
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: job.match >= 85 ? '#22c55e' : '#FCAA2D' }}>{job.match}%</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    color: '#FCAA2D',
    bg: 'rgba(252,170,45,0.12)',
    number: '03',
    title: 'Match Scoring & Explanations',
    tagline: 'Know your fit before you spend 45 minutes applying.',
    description:
      'Every result comes with an AI-generated match score (0–100), a one-line reason why it fits, and an honest breakdown of your strengths and gaps against that specific role.',
    points: [
      'Match score 0–100 compared against your exact resume profile',
      'Strengths: which of your projects/skills map to the JD',
      'Gaps: what\'s missing and how severe it actually is',
      'Strategic framing advice for how to position yourself',
    ],
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    visual: (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Software Engineer · Perplexity</span>
          <span className="text-lg font-bold font-mono" style={{ color: '#22c55e' }}>92%</span>
        </div>
        <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: 'var(--bg-3)' }}>
          <div style={{ width: '92%', height: '100%', backgroundColor: '#22c55e', borderRadius: 9999 }} />
        </div>
        <div className="space-y-2 mb-3">
          {[
            { label: 'RAG systems', detail: 'ConRAC maps to their search pipeline', type: 'strength' },
            { label: 'LLM fine-tuning', detail: 'LLaMA work matches model training', type: 'strength' },
            { label: 'Vue.js', detail: 'They use Vue; you know React (low risk)', type: 'gap' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-2 text-xs">
              <span>{item.type === 'strength' ? '✅' : '⚠️'}</span>
              <div>
                <span className="font-medium" style={{ color: 'var(--text)' }}>{item.label}</span>
                <span style={{ color: 'var(--text-4)' }}> — {item.detail}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(252,170,45,0.1)', color: '#FCAA2D' }}>
          💡 Lead with ConRAC retrieval work — it's their core product.
        </div>
      </div>
    ),
  },
  {
    color: '#F06292',
    bg: 'rgba(240,98,146,0.12)',
    number: '04',
    title: 'Pitch Generator',
    tagline: 'Tailored pitches that cite your actual work.',
    description:
      'One click generates a cover letter hook, cold email, or interview answer. Every sentence maps a specific project from your resume to a specific requirement in the job description. Not generic — ever.',
    points: [
      'Cover letter hook, cold email, or "Why interested?" answer',
      'Every sentence references real projects from your resume',
      'Key mappings: JD requirement ↔ your exact experience',
      'Framing advice: what to emphasize for this specific role',
    ],
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    visual: (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="flex gap-2 mb-4">
          {['Cover letter', 'Cold email', 'Why interested'].map((t, i) => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: i === 0 ? 'var(--accent)' : 'var(--surface)', color: i === 0 ? '#000' : 'var(--text-3)', border: '1px solid var(--border)' }}>{t}</span>
          ))}
        </div>
        <div className="p-3 rounded-lg text-xs leading-relaxed mb-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
          "Your search ranking team caught my attention — I recently built ConRAC, a retrieval-augmented classification system using the same embed-retrieve-rerank pipeline that powers production search at scale…"
        </div>
        <div className="space-y-1.5">
          {[
            ['LLM features', 'ConRAC — RAG with LLaMA + GPT-4'],
            ['Full-stack', 'Resolve AI — React + GCP deployment'],
          ].map(([req, exp]) => (
            <div key={req} className="flex items-start gap-2 text-xs">
              <span style={{ color: 'var(--text-4)' }}>↳</span>
              <span style={{ color: 'var(--text-4)' }}>{req}:</span>
              <span style={{ color: 'var(--text-2)' }}>{exp}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    color: '#34D399',
    bg: 'rgba(52,211,153,0.12)',
    number: '05',
    title: 'Gap Analysis',
    tagline: 'Strategic skill signals from your top matches.',
    description:
      'After a search, Direct aggregates what every matched role requires and cross-references it against your resume. If 8 of your top 15 matches want Kubernetes, that\'s a career signal — not just a missing keyword.',
    points: [
      'Aggregate skill frequency across all your top matches',
      'Strong skills: what you already have that employers want',
      'Missing skills ranked by how many roles they unlock',
      'One-sentence insight generated by AI based on your data',
    ],
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    visual: (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-medium mb-3" style={{ color: 'var(--text-3)' }}>Based on your top 15 matches</div>
        {[
          { skill: 'Python', pct: 93, have: true },
          { skill: 'React', pct: 73, have: true },
          { skill: 'LLM / RAG', pct: 60, have: true },
          { skill: 'Kubernetes', pct: 53, have: false },
          { skill: 'Go / Golang', pct: 40, have: false },
        ].map((row, i) => (
          <div key={row.skill} className="flex items-center gap-3 py-2" style={{ borderTop: i > 0 ? '1px solid var(--border-2)' : 'none' }}>
            <span className="w-20 shrink-0 text-xs" style={{ color: row.have ? 'var(--text-2)' : 'var(--text-4)' }}>{row.skill}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-3)' }}>
              <div style={{ width: `${row.pct}%`, height: '100%', backgroundColor: row.have ? '#34D399' : '#FCAA2D', borderRadius: 9999 }} />
            </div>
            <span className="w-8 text-right text-xs font-mono" style={{ color: 'var(--text-4)' }}>{row.pct}%</span>
          </div>
        ))}
        <div className="mt-3 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(52,211,153,0.1)', color: '#34D399' }}>
          💡 Adding Kubernetes would unlock 8 more strong-fit roles.
        </div>
      </div>
    ),
  },
  {
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.12)',
    number: '06',
    title: 'Application Tracker',
    tagline: 'Your entire job search in one command center.',
    description:
      'Save roles, mark as applied, move through interview stages. See every application\'s match score and generated pitch in one place. Never lose track of where you stand.',
    points: [
      'Status columns: Saved → Applied → Interviewing → Offer',
      'Match score and pitch stored with each tracked role',
      'Notes per application — context you\'ll forget in a week',
      'Stats: avg match score, days since applied, pipeline health',
    ],
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    visual: (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="flex gap-2 mb-4 text-xs">
          {[['Saved', 12], ['Applied', 8], ['Interview', 3], ['Offer', 1]].map(([label, count]) => (
            <div key={label} className="flex-1 text-center px-2 py-2 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="font-bold font-mono" style={{ color: 'var(--text)' }}>{count}</div>
              <div style={{ color: 'var(--text-4)' }}>{label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[
            { company: 'Perplexity', role: 'SWE', status: 'Interview', match: 92 },
            { company: 'Vercel', role: 'Full Stack', status: 'Applied', match: 84 },
            { company: 'Ramp', role: 'Backend', status: 'Saved', match: 74 },
          ].map(app => (
            <div key={app.company} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div>
                <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{app.company}</div>
                <div className="text-xs" style={{ color: 'var(--text-4)' }}>{app.role}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: '#22c55e' }}>{app.match}%</span>
                <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-3)', color: 'var(--text-3)' }}>{app.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export default function FeaturesPage() {
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <PublicNav />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="px-6 md:px-16 pt-20 pb-14 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-8"
          style={{ backgroundColor: 'rgba(252,170,45,0.12)', color: 'var(--accent)', border: '1px solid rgba(252,170,45,0.25)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Six features, one workflow
        </div>
        <h1 className="font-serif text-5xl md:text-6xl leading-tight mb-5 text-[var(--text)]">
          Everything your<br />
          <span style={{ color: 'var(--accent)' }}>job search needs</span>
        </h1>
        <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
          style={{ color: 'var(--text-3)' }}>
          From uploading your resume to tracking your first offer — every tool built into one
          focused product. No juggling spreadsheets, cover letter docs, and job boards.
        </p>
      </section>

      {/* ── Feature cards ─────────────────────────────────── */}
      <section className="px-6 md:px-16 pb-24 max-w-7xl mx-auto">
        <div className="space-y-8">
          {features.map((f, i) => (
            <div
              key={f.number}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center rounded-2xl p-8 md:p-10"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* Text — alternates side */}
              <div className={i % 2 === 1 ? 'order-1 lg:order-2' : ''}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: f.bg, color: f.color }}>
                    {f.icon}
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color: f.color }}>
                    {f.number}
                  </span>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl mb-2 text-[var(--text)]">
                  {f.title}
                </h2>
                <p className="text-sm font-medium mb-4" style={{ color: f.color }}>{f.tagline}</p>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-3)' }}>
                  {f.description}
                </p>
                <ul className="space-y-2.5">
                  {f.points.map(pt => (
                    <li key={pt} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-3)' }}>
                      <span className="shrink-0 mt-0.5" style={{ color: f.color }}>✓</span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual — alternates side */}
              <div className={i % 2 === 1 ? 'order-2 lg:order-1' : ''}>
                {f.visual}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-24 text-center">
        <div className="max-w-xl mx-auto p-10 rounded-2xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-serif text-3xl md:text-4xl mb-4 text-[var(--text)]">
            All six features,<br />one free account.
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-3)' }}>
            Upload your resume and start searching in under two minutes.
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
