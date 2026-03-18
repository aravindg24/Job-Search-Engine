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

export function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className="px-4 py-3 rounded-xl text-sm font-medium animate-slide-up"
          style={{
            backgroundColor: t.type === 'error'
              ? 'rgba(239,68,68,0.10)'
              : 'rgba(34,197,94,0.10)',
            border: `1px solid ${t.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
            color: t.type === 'error' ? '#dc2626' : '#16a34a',
            boxShadow: '0 4px 16px var(--shadow-lg)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
