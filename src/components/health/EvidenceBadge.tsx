import { EVIDENCE_LABELS } from '../../config/thresholds'
import type { EvidenceLevel } from '../../types/health'

export function EvidenceBadge({ level }: { level: EvidenceLevel }) {
  const { icon, label } = EVIDENCE_LABELS[level]
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-xs">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}
