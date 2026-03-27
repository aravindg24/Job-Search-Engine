import { useResume } from '../hooks/useResume'
import ResumeUpload from '../components/profile/ResumeUpload'
import ParsedProfile from '../components/profile/ParsedProfile'
import WatchSettings from '../components/profile/WatchSettings'
import { toast } from '../components/shared/Toast'
import { useLocation, useNavigate } from 'react-router-dom'

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

  const handleUpload = async (file) => {
    try {
      await upload(file)
      toast('Resume parsed successfully')
      if (isOnboarding) {
        navigate('/search', { replace: true })
      }
    } catch {
      toast(error || 'Upload failed', 'error')
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
    </div>
  )
}
