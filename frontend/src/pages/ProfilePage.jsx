import { useState } from 'react'
import { useResume } from '../hooks/useResume'
import ResumeUpload from '../components/profile/ResumeUpload'
import ParsedProfile from '../components/profile/ParsedProfile'
import WatchSettings from '../components/profile/WatchSettings'
import StoryBank from '../components/profile/StoryBank'
import { toast } from '../components/shared/Toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { inviteUser } from '../utils/api'

function Section({ title, action, children }) {
  return (
    <section
      className="rounded-xl p-6"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: 'var(--text-4)' }}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function ProfilePage() {
  const { profile, loading, uploading, error, upload } = useResume()
  const location = useLocation()
  const navigate = useNavigate()
  const isOnboarding = location.state?.onboarding === true

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState('')

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError('')
    setInviteSent(false)
    try {
      await inviteUser(inviteEmail)
      setInviteSent(true)
      setInviteEmail('')
      toast(`Invite sent to ${inviteEmail}`)
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to send invite.'
      setInviteError(msg)
    } finally {
      setInviteLoading(false)
    }
  }

  const handleUpload = async (file) => {
    try {
      await upload(file)
      toast('Resume parsed successfully')
      if (isOnboarding) {
        navigate('/home', { replace: true })
      }
    } catch (err) {
      toast(err?.response?.data?.detail || err?.message || 'Upload failed', 'error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-5 animate-fade-in">
      {isOnboarding && (
        <div
          className="rounded-xl px-5 py-4 flex items-start gap-3"
          style={{ backgroundColor: 'rgba(232,255,71,0.08)', border: '1px solid rgba(232,255,71,0.2)' }}
        >
          <span className="text-lg leading-none mt-0.5">👋</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Welcome! Let's set up your profile.</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              Upload your resume once and every search will be personalized to your background.
              You'll be taken to search automatically after uploading.
            </p>
          </div>
        </div>
      )}

      <h1
        className="text-2xl font-semibold"
        style={{ color: 'var(--text)', fontFamily: '"Instrument Serif", Georgia, serif' }}
      >
        Your Profile
      </h1>

      {/* Resume upload / profile */}
      <Section
        title={profile ? 'Your Resume' : 'Resume'}
        action={
          profile && (
            <button
              onClick={() => document.getElementById('resume-reupload')?.click()}
              className="text-xs transition-colors duration-150"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
            >
              Re-upload
            </button>
          )
        }
      >
        {loading ? (
          <div className="h-32 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-3)' }} />
        ) : profile ? (
          <>
            <ParsedProfile profile={profile} uploadedAt={profile.uploaded_at} />
            <input
              id="resume-reupload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => handleUpload(e.target.files[0])}
            />
          </>
        ) : (
          <ResumeUpload onUpload={handleUpload} uploading={uploading} />
        )}
      </Section>

      {/* Watch preferences */}
      <Section title="Watch Preferences">
        <WatchSettings />
      </Section>

      {/* Story Bank */}
      <Section title="Story Bank">
        <StoryBank />
      </Section>

      {/* Invite */}
      <Section title="Invite Someone">
        <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
          Know someone who's job searching? Send them an invite to Direct.
        </p>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => { setInviteEmail(e.target.value); setInviteSent(false); setInviteError('') }}
            required
            placeholder="their@email.com"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <button
            type="submit"
            disabled={inviteLoading}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-50 whitespace-nowrap"
            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
          >
            {inviteLoading ? 'Sending…' : 'Send Invite'}
          </button>
        </form>

        {inviteSent && (
          <p className="text-xs mt-3 px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
            Invite sent — they'll receive an email with a link to join.
          </p>
        )}
        {inviteError && (
          <p className="text-xs mt-3 px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            {inviteError}
          </p>
        )}
      </Section>
    </div>
  )
}
