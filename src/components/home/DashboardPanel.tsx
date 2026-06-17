import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/**
 * Beige outer container for the right column.
 * Houses NestedPocket children in a "套中套" (panel-within-panel) layout.
 */
export function DashboardPanel({ children }: Props) {
  return (
    <div
      className="flex flex-col gap-3"
      style={{
        background: '#F5F0E8',
        borderRadius: 28,
        padding: 12,
        flex: 1,
        minHeight: 0,
      }}
    >
      {children}
    </div>
  )
}
