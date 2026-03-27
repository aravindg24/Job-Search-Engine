import { NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { dark, toggle } = useTheme()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navCls = ({ isActive }) =>
    `text-sm transition-colors duration-150 ${
      isActive
        ? 'text-ink font-medium dark-active'
        : 'text-ink-3 hover:text-ink'
    }`

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
      style={{
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo */}
      <NavLink to="/search" className="flex items-center gap-2.5 group">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-serif font-bold"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
        >
          R
        </div>
        <span
          className="font-semibold tracking-tight text-sm"
          style={{ color: 'var(--text)' }}
        >
          Direct
        </span>
      </NavLink>

      {/* Nav */}
      <nav className="flex items-center gap-7">
        <NavLink to="/search" className={navCls} style={({ isActive }) => ({ color: isActive ? 'var(--text)' : 'var(--text-3)' })}>
          Search
        </NavLink>
        <NavLink to="/dashboard" className={navCls} style={({ isActive }) => ({ color: isActive ? 'var(--text)' : 'var(--text-3)' })}>
          Dashboard
        </NavLink>
        <NavLink to="/profile" className={navCls} style={({ isActive }) => ({ color: isActive ? 'var(--text)' : 'var(--text-3)' })}>
          Profile
        </NavLink>

        {/* GitHub */}
        <a
          href="https://github.com/aravindg24/Job-Search-Engine"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm transition-colors duration-150"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </a>

        {/* Sign out */}
        {user && (
          <button
            onClick={handleSignOut}
            className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            Sign out
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-3)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg-3)'
            e.currentTarget.style.color = 'var(--text)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'var(--surface-2)'
            e.currentTarget.style.color = 'var(--text-3)'
          }}
        >
          {dark ? (
            /* Sun icon */
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            /* Moon icon */
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
        </button>
      </nav>
    </header>
  )
}
