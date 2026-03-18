import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/layout/Header'
import SearchPage from './pages/SearchPage'
import JobDetailPage from './pages/JobDetailPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
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
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/job/:id" element={<JobDetailPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
        <ToastContainer toasts={toasts} />
      </div>
    </BrowserRouter>
  )
}
