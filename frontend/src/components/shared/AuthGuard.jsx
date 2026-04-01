import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useInactivityLogout } from '../../hooks/useInactivityLogout'

function InactivityWatcher() {
  useInactivityLogout()
  return null
}

export default function AuthGuard({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return (
    <>
      <InactivityWatcher />
      {children}
    </>
  )
}
