import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Header from './components/layout/Header'
import LandingPage from './pages/LandingPage'
import FeaturesPage from './pages/FeaturesPage'
import HowItWorksPage from './pages/HowItWorksPage'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import JobDetailPage from './pages/JobDetailPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import JDAnalyzePage from './pages/JDAnalyzePage'
import SavedJobsPage from './pages/SavedJobsPage'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import AuthGuard from './components/shared/AuthGuard'
import { useToast, ToastContainer } from './components/shared/Toast'
import CommandPalette from './components/shared/CommandPalette'
import { useCommandPalette } from './hooks/useCommandPalette'

function ThemeInit() {
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark')
    }
  }, [])
  return null
}

export default function App() {
  const { toasts } = useToast()
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette()

  return (
    <BrowserRouter>
      <ThemeInit />
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected */}
          <Route path="/*" element={
            <AuthGuard>
              <Header onOpenPalette={() => setPaletteOpen(true)} />
              <main className="flex-1">
                <Routes>
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/job/:id" element={<JobDetailPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/saved-jobs" element={<SavedJobsPage />} />
                  <Route path="/analyze" element={<JDAnalyzePage />} />
                </Routes>
              </main>
            </AuthGuard>
          } />
        </Routes>

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <ToastContainer toasts={toasts} />
        <Analytics />
        <SpeedInsights />
      </div>
    </BrowserRouter>
  )
}
