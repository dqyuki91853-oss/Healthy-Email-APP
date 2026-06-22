import type { FoodFingerprint } from '../../types/bloodPressure'

interface Props {
  fingerprints: FoodFingerprint[]
  compact?: boolean
}

const REACTION_LABELS: Record<FoodFingerprint['reaction'], string> = {
  mild: '反应温和',
  moderate: '反应中等',
  strong: '反应偏强',
}

const REACTION_COLORS: Record<FoodFingerprint['reaction'], string> = {
  mild: 'var(--color-teal)',
  moderate: 'var(--color-gold)',
  strong: 'var(--color-coral)',
}

export function FoodFingerprintCard({ fingerprints, compact = false }: Props) {
  if (fingerprints.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        需要至少 2 次「饮食 + 餐后 2 小时内血压」配对，才会生成食物指纹。
      </p>
    )
  }

  const shown = compact ? fingerprints.slice(0, 3) : fingerprints

  return (
    <ul className="space-y-2">
      {shown.map((fp) => (
        <li
          key={fp.foodName}
          className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{fp.foodName}</p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                {fp.sampleCount} 次配对 · 最近 {fp.lastSeenAt}
              </p>
            </div>
            <span
              className="shrink-0 rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-medium"
              style={{
                color: REACTION_COLORS[fp.reaction],
                background: `color-mix(in srgb, ${REACTION_COLORS[fp.reaction]} 15%, transparent)`,
              }}
            >
              {REACTION_LABELS[fp.reaction]}
            </span>
          </div>
          {!compact && fp.avgPeakDeltaPct > 0.08 && (
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              相对你的个人餐后基线，收缩压峰值大约偏高{' '}
              {Math.round(fp.avgPeakDeltaPct * 100)}%（个体差异，非诊断）
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
