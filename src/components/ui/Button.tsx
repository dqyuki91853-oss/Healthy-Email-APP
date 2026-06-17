import type { ReactNode, ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-teal)] text-[var(--color-text-on-teal)] hover:bg-[var(--color-coral)] shadow-[var(--shadow-card)]',
  secondary:
    'bg-[var(--color-cream)] text-[var(--color-text)] hover:bg-[var(--color-gold)]',
  ghost:
    'border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]',
  danger:
    'border border-[var(--color-coral)] text-[var(--color-coral)] hover:bg-[var(--color-coral)]/10',
}

export function Button({ children, variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
