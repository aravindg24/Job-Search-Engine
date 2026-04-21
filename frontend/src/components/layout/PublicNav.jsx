import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'

export default function PublicNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { dark, toggle } = useTheme()

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Features', path: '/features' },
    { label: 'How it works', path: '/how-it-works' },
  ]

  return (
    <nav
      className="grid grid-cols-3 items-center px-6 md:px-16 py-5 sticky top-0 z-40"
      style={{
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2.5"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: 'var(--accent)', color: '#000' }}
        >
          D
        </div>
        <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text)' }}>
          Direct
        </span>
      </button>

      {/* Center nav links */}
      <div className="hidden md:flex items-center justify-center gap-8">
        {navLinks.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`text-sm bg-transparent border-none cursor-pointer transition-colors duration-150
              ${location.pathname === link.path
                ? 'text-[var(--text)] font-semibold'
                : 'link-muted font-normal'}`}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center justify-end gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 btn-secondary"
        >
          {dark ? (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
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
          className="text-sm px-4 py-1.5 rounded-lg bg-transparent border-none cursor-pointer link-muted"
        >
          Sign in
        </button>
        <button
          onClick={() => navigate('/login', { state: { mode: 'signup' } })}
          className="text-sm px-4 py-2 rounded-lg font-semibold transition-all duration-150 hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)', color: '#000' }}
        >
          Get the app
        </button>
      </div>
    </nav>
  )
}
