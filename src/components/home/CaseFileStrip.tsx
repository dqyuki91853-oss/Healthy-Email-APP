import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, FolderOpen } from 'lucide-react'
import type { CaseFile } from '../../types/caseFile'
import { latestOpenCase } from '../../lib/caseFileStore'

interface Props {
  cases: CaseFile[]
}

export function CaseFileStrip({ cases }: Props) {
  const [expanded, setExpanded] = useState(false)
  const latest = latestOpenCase(cases)

  if (!latest) return null

  return (
    <div className="weather-chronicle weather-chronicle-card mb-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-2)]/50"
        aria-expanded={expanded}
      >
        <FolderOpen size={18} className="shrink-0 text-[var(--weather-leaf)]" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--weather-rain)]">
            个人案卷
          </p>
          <p className="truncate text-sm font-medium text-[var(--weather-text)]">
            #{String(latest.displayNumber).padStart(3, '0')} {latest.title}
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={18} className="text-[var(--weather-text-soft)]" />
        ) : (
          <ChevronDown size={18} className="text-[var(--weather-text-soft)]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[var(--weather-card-border)] px-4 py-3">
          <p className="text-sm text-[var(--weather-text-soft)]">{latest.hypothesis}</p>
          <Link
            to="/chronicle-old"
            className="mt-3 inline-block text-xs font-medium text-[var(--weather-leaf)] hover:underline"
          >
            查看全部案卷 →
          </Link>
        </div>
      )}
    </div>
  )
}
