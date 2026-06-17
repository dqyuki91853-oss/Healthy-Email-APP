type BadgeLevel = 'green' | 'yellow' | 'orange' | 'red'

interface Props {
  level: BadgeLevel
  label: string
  className?: string
}

const levelStyles: Record<BadgeLevel, string> = {
  green: 'bg-[var(--color-green)]/15 text-[var(--color-green)]',
  yellow: 'bg-[var(--color-gold)]/25 text-[var(--color-yellow)]',
  orange: 'bg-[var(--color-orange)]/20 text-[var(--color-orange)]',
  red: 'bg-[var(--color-red)]/35 text-[var(--color-red)]',
}

const levelDots: Record<BadgeLevel, string> = {
  green: 'bg-[var(--color-green)]',
  yellow: 'bg-[var(--color-yellow)]',
  orange: 'bg-[var(--color-orange)]',
  red: 'bg-[var(--color-red)]',
}

export function Badge({ level, label, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium ${levelStyles[level]} ${className}`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${levelDots[level]}`} />
      {label}
    </span>
  )
}
