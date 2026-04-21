export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      {icon && (
        <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-3 text-[var(--text-4)]">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-[var(--text-2)] mb-1">{title}</p>
      {description && (
        <p className="text-xs text-[var(--text-4)] max-w-[220px] leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
