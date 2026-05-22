import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, width = 'max-w-2xl' }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(15,15,14,0.65)' }}
        onClick={onClose}
      />

      {/* Sheet / dialog */}
      <div
        className={`relative w-full rounded-t-2xl md:rounded-2xl shadow-2xl ${width} max-h-[88vh] md:max-h-[90vh] overflow-y-auto animate-slide-up md:animate-fade-in`}
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Drag handle (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-0">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: 'var(--border)' }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0"
          style={{
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 className="text-base font-semibold truncate pr-4" style={{ color: 'var(--text)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 btn-secondary border-transparent"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
