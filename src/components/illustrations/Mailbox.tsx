interface Props {
  size?: number
}

export function Mailbox({ size = 80 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="邮箱插画"
    >
      {/* Post */}
      <rect x="56" y="65" width="8" height="35" rx="2" fill="var(--color-gold)" />
      {/* Box body */}
      <rect x="25" y="35" width="70" height="40" rx="8" fill="var(--color-teal)" />
      {/* Box top (arched) */}
      <path
        d="M25 43C25 35 35 25 60 25C85 25 95 35 95 43"
        fill="var(--color-teal)"
        stroke="var(--color-teal)"
        strokeWidth="2"
      />
      {/* Envelope slot */}
      <rect x="35" y="33" width="50" height="6" rx="3" fill="var(--color-surface)" />
      {/* Envelope peeking out */}
      <rect x="42" y="20" width="36" height="24" rx="4" fill="var(--color-blush)" />
      <path d="M42 20L60 34L78 20" stroke="var(--color-coral)" strokeWidth="1.5" fill="none" />
      {/* Base plate */}
      <rect x="22" y="72" width="76" height="6" rx="3" fill="var(--color-gold)" />
    </svg>
  )
}
