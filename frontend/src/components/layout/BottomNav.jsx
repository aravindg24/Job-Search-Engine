import { NavLink, useNavigate } from 'react-router-dom'
import { clearSession } from '../../hooks/useSearch'

function HomeIcon({ active }) {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} viewBox="0 0 24 24">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H15v-6H9v6H4a1 1 0 01-1-1V9.5z" />
    </svg>
  )
}

function SearchIcon({ active }) {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} viewBox="0 0 24 24">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" />
    </svg>
  )
}

function DashboardIcon({ active }) {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function SavedIcon({ active }) {
  return (
    <svg width="20" height="20" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2 : 1.8} viewBox="0 0 24 24">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
    </svg>
  )
}

function ProfileIcon({ active }) {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

const NAV_ITEMS = [
  { label: 'Home', to: '/home', Icon: HomeIcon, isHome: true },
  { label: 'Search', to: '/search', Icon: SearchIcon },
  { label: 'Dashboard', to: '/dashboard', Icon: DashboardIcon },
  { label: 'Saved', to: '/saved-jobs', Icon: SavedIcon },
  { label: 'Profile', to: '/profile', Icon: ProfileIcon },
]

export default function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch"
      style={{
        backgroundColor: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map(({ label, to, Icon, isHome }) => {
        if (isHome) {
          return (
            <button
              key={to}
              onClick={() => { clearSession(); navigate('/home') }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[var(--text-4)] active:text-[var(--text)] transition-colors"
            >
              <Icon active={false} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        }
        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors
               ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-4)]'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
