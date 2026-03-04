export default function TagPill({ tag }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-surface-2 text-text-secondary border border-border">
      {tag}
    </span>
  )
}
