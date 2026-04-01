import { NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../hooks/useAuth'
import { clearSession } from '../../hooks/useSearch'

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
      <NavLink to="/home" className="flex items-center gap-2.5 group">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-serif font-bold"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
        >
          D
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
        {/* Home clears the last search so /search opens fresh */}
        <button
          onClick={() => { clearSession(); navigate('/home') }}
          className="text-sm transition-colors duration-150"
          style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          Home
        </button>
        <NavLink to="/search" className={navCls} style={({ isActive }) => ({ color: isActive ? 'var(--text)' : 'var(--text-3)' })}>
          Search
        </NavLink>
        <NavLink to="/dashboard" className={navCls} style={({ isActive }) => ({ color: isActive ? 'var(--text)' : 'var(--text-3)' })}>
          Dashboard
        </NavLink>
        <NavLink to="/profile" className={navCls} style={({ isActive }) => ({ color: isActive ? 'var(--text)' : 'var(--text-3)' })}>
          Profile
        </NavLink>

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
