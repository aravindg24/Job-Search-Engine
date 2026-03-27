import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState(location.state?.mode || 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)   // signup success screen
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setConfirmed(true)   // show confirmation screen
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // AuthGuard will redirect automatically on session change
      }
    } catch (err) {
      const msg = err.message || 'Something went wrong.'
      // Make "Email not confirmed" error actionable
      if (msg.toLowerCase().includes('email not confirmed')) {
        setError('email_not_confirmed')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setResent(false)
    try {
      await supabase.auth.resend({ type: 'signup', email })
      setResent(true)
    } catch {
      // fail silently — email rate limits are common on free tier
    } finally {
      setResending(false)
    }
  }

  // ── Signup success screen ────────────────────────────────
  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--bg)' }}>
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
            Check your email
          </h2>
          <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-3)' }}>
            We sent a confirmation link to
          </p>
          <p className="text-sm font-semibold mb-6" style={{ color: 'var(--text)' }}>{email}</p>
          <p className="text-xs mb-8" style={{ color: 'var(--text-4)' }}>
            Click the link in the email to activate your account, then come back here to sign in.
            Check your spam folder if you don't see it.
          </p>

          {resent ? (
            <p className="text-xs mb-4 px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
              Confirmation email resent — check your inbox.
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm mb-4 transition-colors disabled:opacity-50"
              style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
            >
              {resending ? 'Sending…' : "Didn't receive it? Resend email"}
            </button>
          )}

          <br />
          <button
            onClick={() => { setConfirmed(false); setMode('signin') }}
            className="text-sm px-6 py-2.5 rounded-xl font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  // ── Sign in / Sign up form ───────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm mb-3"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}>
            D
          </div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Direct</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          {/* Tab toggle */}
          <div className="flex rounded-lg p-1 mb-5" style={{ backgroundColor: 'var(--bg-2)' }}>
            {['signin', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className="flex-1 text-sm py-1.5 rounded-md transition-all duration-150 font-medium"
                style={mode === m
                  ? { backgroundColor: 'var(--surface)', color: 'var(--text)', boxShadow: '0 1px 3px var(--shadow)' }
                  : { color: 'var(--text-3)' }
                }
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            {/* Email not confirmed — special case */}
            {error === 'email_not_confirmed' && (
              <div className="px-3 py-3 rounded-lg text-xs space-y-2"
                style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ color: '#ef4444' }}>
                  Email not confirmed yet. Check your inbox (and spam folder) for the confirmation link.
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resent}
                  className="font-medium underline transition-opacity disabled:opacity-50"
                  style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {resent ? 'Email resent ✓' : resending ? 'Sending…' : 'Resend confirmation email'}
                </button>
              </div>
            )}

            {/* Generic error */}
            {error && error !== 'email_not_confirmed' && (
              <p className="text-xs px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: '#000' }}
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-4)' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
            className="underline transition-colors"
            style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            {mode === 'signin' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
