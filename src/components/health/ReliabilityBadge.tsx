import { RELIABILITY_LABELS } from '../../config/reliability'
import type { ReliabilityLevel } from '../../types/health'

export function ReliabilityBadge({ level, note }: { level: ReliabilityLevel; note?: string }) {
  const { dot, label } = RELIABILITY_LABELS[level]
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)]" title={note}>
      <span>{dot}</span>
      <span>{label}</span>
    </span>
  )
}
