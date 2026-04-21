export function SectionHeader({ title, subtitle, count, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-[3px] h-5 rounded-full bg-[var(--accent)] flex-shrink-0" />
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            {title}
            {count != null && (
              <span className="text-xs font-mono bg-[var(--accent-light)] text-[var(--accent-dark)] px-1.5 py-0.5 rounded-md">
                {count}
              </span>
            )}
          </h2>
          {subtitle && (
            <p className="text-xs text-[var(--text-3)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
