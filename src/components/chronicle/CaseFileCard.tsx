import type { CaseFile, CaseFileStatus } from '../../types/caseFile'
import type { ConfidenceLevel } from '../../types/bodyWeather'

const CONFIDENCE_LABEL: Record<ConfidenceLevel, { emoji: string; label: string }> = {
  high: { emoji: '🟢', label: '高置信度' },
  medium: { emoji: '🟡', label: '中等置信度' },
  low: { emoji: '🔴', label: '低置信度' },
}

interface Props {
  caseFile: CaseFile
  onStatusChange?: (id: string, status: CaseFileStatus) => void
}

export function CaseFileCard({ caseFile, onStatusChange }: Props) {
  const conf = CONFIDENCE_LABEL[caseFile.confidence]
  const isVerified = caseFile.status === 'verified'

  return (
    <article
      className={`weather-chronicle weather-chronicle-card p-5 transition-colors ${
        isVerified ? 'bg-[var(--season-spring-soft)]/30' : ''
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-[var(--weather-text-soft)]">
          案卷 #{String(caseFile.displayNumber).padStart(3, '0')}
        </p>
        <span className="shrink-0 text-[11px] text-[var(--weather-text-soft)]">
          {conf.emoji} {conf.label}
        </span>
      </div>

      <h3 className="text-base font-semibold text-[var(--weather-text)]">{caseFile.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--weather-text-soft)]">
        {caseFile.hypothesis}
      </p>

      {caseFile.evidence.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-[var(--weather-text-soft)]">
          {caseFile.evidence.map((e) => (
            <li key={e.label}>
              · {e.label}
              {e.value ? `：${e.value}` : ''}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[10px] text-[var(--weather-text-soft)]">
        发现于 {caseFile.discoveredAt}
      </p>

      {onStatusChange && caseFile.status !== 'dismissed' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {caseFile.status !== 'verified' && (
            <button
              type="button"
              onClick={() => onStatusChange(caseFile.id, 'verified')}
              className="rounded-full border border-[var(--weather-leaf)]/40 px-3 py-1 text-xs text-[var(--weather-leaf)] hover:bg-[var(--weather-leaf)]/10"
            >
              标记为已验证
            </button>
          )}
          {caseFile.status !== 'testing' && caseFile.status !== 'verified' && (
            <button
              type="button"
              onClick={() => onStatusChange(caseFile.id, 'testing')}
              className="rounded-full border border-[var(--weather-rain)]/30 px-3 py-1 text-xs text-[var(--weather-rain)] hover:bg-[var(--weather-rain)]/10"
            >
              试一周
            </button>
          )}
          <button
            type="button"
            onClick={() => onStatusChange(caseFile.id, 'dismissed')}
            className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--weather-text-soft)] hover:bg-[var(--color-surface-2)]"
          >
            忽略
          </button>
        </div>
      )}
    </article>
  )
}
