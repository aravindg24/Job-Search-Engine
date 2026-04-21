const variants = {
  primary:   'bg-[var(--accent)] text-black hover:brightness-105 border border-transparent',
  secondary: 'btn-secondary',
  ghost:     'bg-transparent hover:bg-[var(--surface-2)] text-[var(--text-3)] hover:text-[var(--text)] border border-transparent',
  danger:    'bg-transparent text-red-500 border border-[var(--border)] hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30',
  accent:    'bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[rgba(252,170,45,0.25)] hover:bg-[rgba(252,170,45,0.18)] hover:border-[rgba(252,170,45,0.45)]',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-lg',
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export function Button({ variant = 'secondary', size = 'md', loading = false, className = '', children, ...props }) {
  return (
    <button
      className={`font-medium inline-flex items-center gap-2 transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
