import type { ReactNode } from 'react'

type CardVariant = 'default' | 'cream' | 'blush' | 'teal'

interface Props {
  children: ReactNode
  className?: string
  variant?: CardVariant
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-[var(--color-surface)]',
  cream: 'bg-[var(--color-cream)]/40',
  blush: 'bg-[var(--color-blush)]/30',
  teal: 'bg-[var(--color-teal)]/10',
}

export function Card({ children, className = '', variant = 'default' }: Props) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] ${variantStyles[variant]} p-5 ${className}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {children}
    </div>
  )
}
