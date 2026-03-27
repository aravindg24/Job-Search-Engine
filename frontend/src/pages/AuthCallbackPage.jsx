import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { getResumeProfile } from '../utils/api'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase automatically exchanges the token from the URL hash.
    // Wait for the session to be ready, then route accordingly.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        let hasProfile = false
        try {
          await getResumeProfile()
          hasProfile = true
        } catch {
          hasProfile = false
        }
        navigate(hasProfile ? '/search' : '/profile', { replace: true, state: { onboarding: !hasProfile } })
      }
    })

    // Also check immediately in case the session is already set
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        let hasProfile = false
        try {
          await getResumeProfile()
          hasProfile = true
        } catch {
          hasProfile = false
        }
        navigate(hasProfile ? '/search' : '/profile', { replace: true, state: { onboarding: !hasProfile } })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: 'var(--text-3)' }}>Signing you in…</p>
    </div>
  )
}
