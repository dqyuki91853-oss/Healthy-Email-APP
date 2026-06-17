import { Link } from 'react-router-dom'
import { EvidenceBadge } from './EvidenceBadge'
import type { DirectionScore } from '../../types/prediction'

const LEVEL_COLORS: Record<string, string> = {
  green: 'text-[var(--color-green)]',
  yellow: 'text-[var(--color-yellow)]',
  orange: 'text-[var(--color-orange)]',
  red: 'text-[var(--color-red)]',
}

interface Props {
  score: DirectionScore
}

export function DirectionScoreCard({ score }: Props) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">{score.label}</h3>
        <span className={`text-sm font-semibold ${LEVEL_COLORS[score.level]}`}>
          {score.riskScore}/100
        </span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-green)] via-[var(--color-yellow)] to-[var(--color-red)]"
          style={{ width: `${score.riskScore}%` }}
        />
      </div>
      {score.riskItems.length > 0 ? (
        <ul className="mb-3 space-y-1 text-xs text-[var(--color-muted)]">
          {score.riskItems.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-[var(--color-green)]">暂无异常信号</p>
      )}
      <p className="text-xs text-[var(--color-muted)]">{score.recommendation}</p>
      <div className="mt-2 flex items-center justify-between">
        {score.level !== 'green' && (
          <>
            {score.level === 'red' && <EvidenceBadge level="strong" />}
            {score.level === 'orange' && <EvidenceBadge level="moderate" />}
            {score.level === 'yellow' && <EvidenceBadge level="heuristic" />}
          </>
        )}
        {score.actionRoute && score.level !== 'green' && (
          <Link to={score.actionRoute} className="text-xs text-[var(--color-accent)]">
            详情 →
          </Link>
        )}
      </div>
    </div>
  )
}
