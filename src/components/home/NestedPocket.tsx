import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  title?: string
  className?: string
}

/**
 * White inner card ("pocket") inside the beige DashboardPanel.
 * overflow: visible — never clips TCM buttons or expand panels.
 */
export function NestedPocket({ children, title, className = '' }: Props) {
  return (
    <div
      className={`rounded-[20px] bg-white p-[14px_16px] ${className}`}
      style={{
        border: '1px solid var(--color-border)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(44,44,44,0.04)',
        overflow: 'visible',
        minHeight: 0,
      }}
    >
      {title && (
        <p className="mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {title}
        </p>
      )}
      {children}
    </div>
  )
}
