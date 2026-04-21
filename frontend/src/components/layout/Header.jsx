import { useState } from 'react'
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

function MenuIcon({ open }) {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
      className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    >
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  )
}

export default function Header() {
  const { dark, toggle } = useTheme()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

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

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-lg flex items-center justify-center btn-secondary"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            className="w-8 h-8 rounded-lg flex items-center justify-center btn-secondary"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="md:hidden animate-slide-up"
          style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <nav className="px-4 py-3 space-y-1">
            <button
              onClick={() => { clearSession(); navigate('/home'); setMenuOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium link-muted text-left bg-transparent border-none cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
            >
              Home
            </button>
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                   ${isActive
                     ? 'bg-[var(--accent-light)] text-[var(--text)]'
                     : 'text-[var(--text-3)] hover:bg-[var(--surface-2)]'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {user && (
              <button
                onClick={() => { handleSignOut(); setMenuOpen(false) }}
                className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left bg-transparent border-none cursor-pointer"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
