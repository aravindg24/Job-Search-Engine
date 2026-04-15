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

  const btnBase = {
    minWidth: '32px',
    height: '32px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: '1px solid var(--border)',
    transition: 'all 0.15s',
    padding: '0 8px',
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          ...btnBase,
          backgroundColor: 'var(--surface)',
          color: currentPage === 1 ? 'var(--text-4)' : 'var(--text-3)',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          opacity: currentPage === 1 ? 0.4 : 1,
        }}
        onMouseEnter={e => { if (currentPage !== 1) e.currentTarget.style.borderColor = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        ←
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} style={{ color: 'var(--text-4)', padding: '0 4px', fontSize: '13px' }}>
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              ...btnBase,
              backgroundColor: currentPage === page ? 'var(--accent)' : 'var(--surface)',
              color: currentPage === page ? 'var(--bg)' : 'var(--text-3)',
              borderColor: currentPage === page ? 'var(--accent)' : 'var(--border)',
              fontWeight: currentPage === page ? '700' : '500',
            }}
            onMouseEnter={e => { if (currentPage !== page) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text)' } }}
            onMouseLeave={e => { if (currentPage !== page) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' } }}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          ...btnBase,
          backgroundColor: 'var(--surface)',
          color: currentPage === totalPages ? 'var(--text-4)' : 'var(--text-3)',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          opacity: currentPage === totalPages ? 0.4 : 1,
        }}
        onMouseEnter={e => { if (currentPage !== totalPages) e.currentTarget.style.borderColor = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        →
      </button>
    </div>
  )
}
