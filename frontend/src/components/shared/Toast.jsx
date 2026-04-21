import { useState, useCallback } from 'react'

let toastFn = null

export function useToast() {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  toastFn = show

  return { toasts, show }
}

export function toast(message, type = 'success') {
  if (toastFn) toastFn(message, type)
}

const TOAST_STYLES = {
  success: {
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.25)',
    color: '#16a34a',
    icon: '✓',
  },
  error: {
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.25)',
    color: '#dc2626',
    icon: '✕',
  },
  info: {
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.25)',
    color: '#2563eb',
    icon: 'ℹ',
  },
  warning: {
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.25)',
    color: '#d97706',
    icon: '⚠',
  },
}

export function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => {
        const s = TOAST_STYLES[t.type] || TOAST_STYLES.success
        return (
          <div
            key={t.id}
            className="px-4 py-3 rounded-xl text-sm font-medium animate-slide-up flex items-center gap-2"
            style={{
              backgroundColor: s.bg,
              border: `1px solid ${s.border}`,
              color: s.color,
              boxShadow: '0 4px 16px var(--shadow-lg)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="text-xs shrink-0">{s.icon}</span>
            {t.message}
          </div>
        )
      })}
    </div>
  )
}
