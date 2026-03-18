import { useResume } from '../hooks/useResume'
import ResumeUpload from '../components/profile/ResumeUpload'
import ParsedProfile from '../components/profile/ParsedProfile'
import WatchSettings from '../components/profile/WatchSettings'
import { toast } from '../components/shared/Toast'

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

  const handleUpload = async (file) => {
    try {
      await upload(file)
      toast('Resume parsed successfully')
    } catch {
      toast(error || 'Upload failed', 'error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-5 animate-fade-in">
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
