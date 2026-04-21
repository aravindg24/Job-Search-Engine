export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const navCls = (disabled) =>
    `min-w-[32px] h-8 px-2 rounded-lg text-[13px] font-medium flex items-center justify-center transition-all duration-150 border
    ${disabled
      ? 'opacity-40 cursor-not-allowed border-[var(--border)] text-[var(--text-4)] bg-[var(--surface)]'
      : 'border-[var(--border)] text-[var(--text-3)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--text)]'
    }`

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={navCls(currentPage === 1)}
      >
        ←
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="text-[13px] px-1 text-[var(--text-4)]">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[32px] h-8 px-2 rounded-lg text-[13px] flex items-center justify-center transition-all duration-150 border
              ${currentPage === page
                ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)] font-bold'
                : 'bg-[var(--surface)] text-[var(--text-3)] border-[var(--border)] font-medium hover:border-[var(--accent)] hover:text-[var(--text)]'
              }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={navCls(currentPage === totalPages)}
      >
        →
      </button>
    </div>
  )
}
