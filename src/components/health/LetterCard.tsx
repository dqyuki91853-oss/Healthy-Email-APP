import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export function LetterCard({ children, className = '' }: Props) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-8 ${className}`}
      style={{
        boxShadow: 'var(--shadow-card)',
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 31px, var(--color-border) 31px, var(--color-border) 32px)',
      }}
    >
      {children}
    </div>
  )
}
