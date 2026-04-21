import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const RECENT_KEY = 'direct_recent_queries'

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

const SUGGESTIONS = [
  'remote AI startup, Series A–B',
  'fintech data engineering, no big tech',
  'ML engineer, research-focused',
  'full-stack with LLM work, remote',
]

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState([])
  const [focused, setFocused] = useState(-1)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQuery('')
      setFocused(-1)
      setRecent(loadRecent().slice(0, 5))
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const items = query.trim()
    ? []
    : recent.length > 0
      ? recent
      : SUGGESTIONS

  const handleSubmit = (q = query) => {
    const trimmed = q.trim()
    if (!trimmed) return
    onClose()
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const handleKey = (e) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'Enter') { handleSubmit(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocused(f => Math.min(f + 1, items.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocused(f => Math.max(f - 1, -1))
    }
    if (e.key === 'Enter' && focused >= 0 && items[focused]) {
      handleSubmit(items[focused])
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh] cmd-backdrop"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl mx-4 rounded-2xl overflow-hidden cmd-panel"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-[var(--accent)] font-mono text-xl select-none leading-none">›</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setFocused(-1) }}
            onKeyDown={handleKey}
            placeholder="describe the role you're looking for..."
            className="flex-1 bg-transparent font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-4)] outline-none caret-[var(--accent)]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[var(--text-4)] hover:text-[var(--text-3)] transition-colors text-lg leading-none"
            >
              ×
            </button>
          )}
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded font-mono text-[var(--text-4)]"
            style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}
          >
            esc
          </kbd>
        </div>

        {/* List */}
        {items.length > 0 && (
          <div className="py-2 px-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] px-3 py-1.5">
              {recent.length > 0 && !query.trim() ? 'Recent searches' : 'Try these'}
            </p>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(item)}
                onMouseEnter={() => setFocused(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left group ${
                  focused === i ? 'bg-[var(--bg-2)]' : 'hover:bg-[var(--bg-2)]'
                }`}
              >
                <span className="text-[var(--text-4)] text-sm shrink-0">
                  {recent.length > 0 && !query.trim() ? '↺' : '⟶'}
                </span>
                <span className="text-sm text-[var(--text-2)] flex-1 truncate font-mono">{item}</span>
                <span
                  className="text-xs text-[var(--accent)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ↵
                </span>
              </button>
            ))}
          </div>
        )}

        {query.trim() && (
          <div className="py-2 px-2">
            <button
              onClick={() => handleSubmit()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--accent-light)] hover:bg-[rgba(252,170,45,0.18)] transition-colors text-left"
            >
              <span className="text-[var(--accent)] text-sm shrink-0">⟶</span>
              <span className="text-sm text-[var(--text)] flex-1 truncate font-mono">"{query}"</span>
              <span className="text-xs text-[var(--accent)] shrink-0 font-medium">Search →</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-5 py-2.5 text-[10px] text-[var(--text-4)] font-mono"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span><kbd className="bg-[var(--bg-3)] border border-[var(--border)] px-1.5 py-0.5 rounded">↵</kbd> search</span>
          <span><kbd className="bg-[var(--bg-3)] border border-[var(--border)] px-1.5 py-0.5 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-[var(--bg-3)] border border-[var(--border)] px-1.5 py-0.5 rounded">esc</kbd> close</span>
          <span className="ml-auto opacity-50">⌘K</span>
        </div>
      </div>
    </div>
  )
}
