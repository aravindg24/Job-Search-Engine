import { useNavigate } from 'react-router-dom'
import { useResume } from '../hooks/useResume'
import SearchBar from '../components/search/SearchBar'

export default function HomePage() {
  const { profile } = useResume()
  const navigate = useNavigate()

  const handleSearch = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="w-full max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-10 animate-fade-in">
          <p
            className="text-xs font-mono font-medium tracking-widest uppercase mb-5"
            style={{ color: 'var(--accent)' }}
          >
            AI Job Search
          </p>
          <h1
            className="text-4xl leading-tight mb-3"
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}
          >
            Describe yourself.<br />
            <span style={{ color: 'var(--accent)' }}>Find your next role.</span>
          </h1>
          <p
            className="text-base leading-relaxed max-w-md mx-auto"
            style={{ color: 'var(--text-3)' }}
          >
            Semantic search that understands who you are — not just what you type.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} loading={false} resumeProfile={profile} />
      </div>
    </div>
  )
}
