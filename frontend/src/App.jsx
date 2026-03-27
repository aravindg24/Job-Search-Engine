import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Header from './components/layout/Header'
import LandingPage from './pages/LandingPage'
import FeaturesPage from './pages/FeaturesPage'
import HowItWorksPage from './pages/HowItWorksPage'
import SearchPage from './pages/SearchPage'
import JobDetailPage from './pages/JobDetailPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import AuthGuard from './components/shared/AuthGuard'
import { useToast, ToastContainer } from './components/shared/Toast'

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

          {/* Protected */}
          <Route path="/*" element={
            <AuthGuard>
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/job/:id" element={<JobDetailPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Routes>
              </main>
            </AuthGuard>
          } />
        </Routes>
        <ToastContainer toasts={toasts} />
        <Analytics />
      </div>
    </BrowserRouter>
  )
}
