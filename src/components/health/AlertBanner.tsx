import { Link } from 'react-router-dom'
import type { HealthAlert } from '../../types/alerts'
import { Badge } from '../ui/Badge'

const LEVEL_LABELS = {
  red: '高风险' as const,
  orange: '预警' as const,
  yellow: '关注' as const,
  green: '正常' as const,
}

interface Props {
  alerts: HealthAlert[]
}

export function AlertBanner({ alerts }: Props) {
  const active = alerts.filter((a) => !a.acknowledged)
  if (!active.length) return null

  const top = [...active].sort((a, b) => {
    const o = { red: 0, orange: 1, yellow: 2, green: 3 }
    return o[a.level] - o[b.level]
  })[0]

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-[var(--radius-pill)] px-5 py-3"
      style={{
        background:
          top.level === 'red' ? 'rgba(221,124,100,0.15)' :
          top.level === 'orange' ? 'rgba(221,124,100,0.10)' :
          top.level === 'yellow' ? 'rgba(235,201,127,0.20)' :
          'rgba(99,173,150,0.10)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <Badge level={top.level} label={LEVEL_LABELS[top.level]} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{top.title}</p>
        <p className="text-xs text-[var(--color-muted)] truncate">{top.message}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {top.actionRoute && (
          <Link
            to={top.actionRoute}
            className="rounded-[var(--radius-pill)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] shadow-[var(--shadow-card)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            查看详情
          </Link>
        )}
        <Link
          to="/alerts"
          className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          全部 {active.length} 条
        </Link>
      </div>
    </div>
  )
}
