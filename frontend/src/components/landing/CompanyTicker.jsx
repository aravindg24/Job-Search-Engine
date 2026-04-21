const ITEMS = [
  { company: 'Anthropic', role: 'ML Engineer', match: 88 },
  { company: 'Perplexity', role: 'Software Engineer', match: 92 },
  { company: 'Vercel', role: 'Full Stack Engineer', match: 84 },
  { company: 'Linear', role: 'AI Engineer', match: 79 },
  { company: 'Ramp', role: 'Backend Engineer', match: 74 },
  { company: 'Modal', role: 'Senior Engineer', match: 71 },
  { company: 'Stripe', role: 'Platform Engineer', match: 86 },
  { company: 'Figma', role: 'Staff Engineer', match: 81 },
  { company: 'Notion', role: 'Product Engineer', match: 77 },
  { company: 'Cohere', role: 'ML Researcher', match: 90 },
  { company: 'Mistral', role: 'Research Engineer', match: 83 },
  { company: 'Hugging Face', role: 'Open Source Eng', match: 78 },
]

function matchColor(m) {
  if (m >= 80) return '#22C55E'
  if (m >= 65) return '#F59E0B'
  return '#71717A'
}

function TickerItem({ company, role, match }) {
  const color = matchColor(match)
  return (
    <div className="inline-flex items-center gap-3 mx-6 shrink-0">
      <span
        className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-md"
        style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
      >
        {match}%
      </span>
      <span className="text-sm font-medium text-[var(--text-2)]">{role}</span>
      <span className="text-xs text-[var(--text-4)]">at</span>
      <span className="text-sm font-semibold text-[var(--text)]">{company}</span>
      <span className="w-px h-4 bg-[var(--border)] shrink-0" />
    </div>
  )
}

export default function CompanyTicker() {
  const doubled = [...ITEMS, ...ITEMS]

  return (
    <div
      className="overflow-hidden py-3 border-y border-[var(--border)]"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      <div className="ticker-track flex items-center w-max">
        {doubled.map((item, i) => (
          <TickerItem key={i} {...item} />
        ))}
      </div>
    </div>
  )
}
