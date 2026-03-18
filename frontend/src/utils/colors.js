export function matchColor(score) {
  if (score >= 80) return '#16a34a'
  if (score >= 60) return '#b45309'
  return 'var(--text-4)'
}

export function matchBg(score) {
  if (score >= 80) return 'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400'
  if (score >= 60) return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400'
  return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/30 dark:text-zinc-400 dark:border-zinc-700'
}

export function statusColor(status) {
  const map = {
    saved:        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-300',
    applied:      'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    interviewing: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
    offered:      'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    rejected:     'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    withdrawn:    'bg-zinc-50 text-zinc-400 dark:bg-zinc-800/20 dark:text-zinc-500',
  }
  return map[status] || map.saved
}
