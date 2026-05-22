import { NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../hooks/useAuth'
import { clearSession } from '../../hooks/useSearch'

const NAV_LINKS = [
  { label: 'Search', to: '/search' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Saved', to: '/saved-jobs' },
  { label: 'Profile', to: '/profile' },
]

function SunIcon() {
  return (
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
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  )
}


export default function Header({ onOpenPalette }) {
  const { dark, toggle } = useTheme()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navCls = ({ isActive }) =>
    `text-sm transition-colors duration-150 ${
      isActive ? 'text-[var(--text)] font-medium' : 'link-muted'
    }`

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <NavLink to="/home" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-serif font-bold"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
          >
            D
          </div>
          <span className="font-semibold tracking-tight text-sm text-[var(--text)]">
            Direct
          </span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          <button
            onClick={() => { clearSession(); navigate('/home') }}
            className="text-sm link-muted bg-transparent border-none cursor-pointer"
          >
            Home
          </button>
          {NAV_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} className={navCls}>
              {link.label}
            </NavLink>
          ))}

          {user && (
            <button
              onClick={handleSignOut}
              className="text-xs px-3 py-1.5 rounded-lg btn-secondary font-medium hover:text-red-500 hover:border-red-200 transition-all duration-150"
            >
              Sign out
            </button>
          )}

          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-lg flex items-center justify-center btn-secondary transition-all duration-150"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>

        {/* Mobile controls — theme + sign out (nav handled by BottomNav) */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-lg flex items-center justify-center btn-secondary"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          {user && (
            <button
              onClick={handleSignOut}
              className="text-xs px-3 py-1.5 rounded-lg btn-secondary font-medium hover:text-red-500 hover:border-red-200 transition-all duration-150"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
