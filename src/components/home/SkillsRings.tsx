interface SkillItem {
  label: string
  pct: number
  color: string
}

interface Props {
  skills: SkillItem[]
  /** 'grid' = 2×2 cards (default); 'vertical' = list of horizontal items */
  layout?: 'grid' | 'vertical'
}

function CircularProgress({ pct, color, size = 56, strokeWidth = 6 }: { pct: number; color: string; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <svg width={size} height={size} className="shrink-0 rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SkillsRings({ skills, layout = 'grid' }: Props) {
  if (layout === 'vertical') {
    return (
      <div className="space-y-2.5">
        {skills.map((skill) => (
          <div
            key={skill.label}
            className="flex items-center gap-3"
          >
            <CircularProgress pct={skill.pct} color={skill.color} size={40} strokeWidth={5} />
            <p className="text-[13px] font-medium flex-1">{skill.label}</p>
            <p className="text-xs text-[var(--color-muted)] tabular-nums">{skill.pct}%</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="rounded-[20px] bg-[var(--color-surface)] p-6"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <h3 className="mb-4 text-base font-semibold">本周概况</h3>
      <div className="grid grid-cols-2 gap-4">
        {skills.map((skill) => (
          <div
            key={skill.label}
            className="flex items-center gap-4 rounded-[16px] bg-[var(--color-surface-2)] p-4"
          >
            <CircularProgress pct={skill.pct} color={skill.color} />
            <div>
              <p className="text-sm font-medium">{skill.label}</p>
              <p className="text-xs text-[var(--color-muted)]">{skill.pct}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
