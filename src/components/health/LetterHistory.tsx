import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { loadBodyReplies, weekKeyForLetterRange } from '../../lib/bodyReplyStore'
import type { WeeklyLetterData } from '../../services/weeklyLetter'

interface Props {
  /** Hide reply for the letter currently being read */
  currentDateRange?: WeeklyLetterData['dateRange']
  refreshKey?: number
}

function formatWeekLabel(reply: ReturnType<typeof loadBodyReplies>[number]): string {
  if (reply.letterDateRange) {
    return `${reply.letterDateRange.start} — ${reply.letterDateRange.end}`
  }
  return `周起始 ${reply.weekKey}`
}

export function LetterHistory({ currentDateRange, refreshKey = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const currentWeekKey = currentDateRange ? weekKeyForLetterRange(currentDateRange) : null

  const pastReplies = useMemo(() => {
    void refreshKey
    return loadBodyReplies()
      .filter((r) => r.weekKey !== currentWeekKey)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [currentWeekKey, refreshKey])

  if (pastReplies.length === 0) return null

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-1 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        <span>过往回信（{pastReplies.length}）</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <ul className="space-y-3 border-t border-[var(--color-border)] pt-3">
          {pastReplies.map((reply) => (
            <li
              key={reply.id}
              className="rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]/50 px-3 py-2"
            >
              <p className="text-[10px] text-[var(--color-muted)]">{formatWeekLabel(reply)}</p>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed">
                {reply.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
