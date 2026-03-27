import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'

export default function PublicNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { dark, toggle } = useTheme()

  const navLinks = [
    { label: 'Features', path: '/features' },
    { label: 'How it works', path: '/how-it-works' },
  ]

  return (
    <nav
      className="flex items-center justify-between px-6 md:px-16 py-5 sticky top-0 z-40"
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
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="text-sm transition-colors duration-150"
            style={{
              color: location.pathname === link.path ? 'var(--text)' : 'var(--text-3)',
              fontWeight: location.pathname === link.path ? 600 : 400,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { if (location.pathname !== link.path) e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { if (location.pathname !== link.path) e.currentTarget.style.color = 'var(--text-3)' }}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Right actions */}
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
          className="text-sm px-4 py-1.5 rounded-lg transition-all duration-150"
          style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          Sign in
        </button>
        <button
          onClick={() => navigate('/login', { state: { mode: 'signup' } })}
          className="text-sm px-4 py-2 rounded-lg font-semibold transition-all duration-150"
          style={{ backgroundColor: 'var(--accent)', color: '#000' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Get the app
        </button>
      </div>
    </nav>
  )
}
