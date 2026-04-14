import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { getResumeProfile } from '../utils/api'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  // Guard so only the first auth signal (getSession OR onAuthStateChange) navigates
  const didNavigate = useRef(false)

  useEffect(() => {
    async function handleSession(session) {
      if (!session || didNavigate.current) return
      didNavigate.current = true
      let hasProfile = false
      try {
        await getResumeProfile()
        hasProfile = true
      } catch {
        hasProfile = false
      }
      navigate(hasProfile ? '/home' : '/profile', {
        replace: true,
        state: { onboarding: !hasProfile },
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'EMAIL_CONFIRMED' || event === 'SIGNED_UP') {
        // Email confirmed — redirect to login with success banner
        navigate('/login', { replace: true, state: { emailConfirmed: true } })
        return
      }

      if (event === 'SIGNED_IN') {
        await handleSession(session)
      }
    })

    // Check immediately for already-active session (magic link token exchange)
    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session))

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: 'var(--text-3)' }}>Signing you in…</p>
    </div>
  )
}
