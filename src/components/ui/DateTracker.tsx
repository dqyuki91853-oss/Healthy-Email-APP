import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { addDays, formatDateZh, todayStr, weekRange } from '../../lib/dates'

interface Props {
  selectedDate: string
  onDateChange: (date: string) => void
  markedDates?: Set<string>
  showWeekStrip?: boolean
}

export function DateTracker({
  selectedDate,
  onDateChange,
  markedDates,
  showWeekStrip = true,
}: Props) {
  const week = weekRange(selectedDate)
  const isToday = selectedDate === todayStr()

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDateChange(addDays(selectedDate, -1))}
          className="rounded-lg border border-[var(--color-border)] p-2 hover:bg-[var(--color-surface-2)]"
          aria-label="前一天"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2">
          <Calendar size={16} className="shrink-0 text-[var(--color-muted)]" />
          <input
            type="date"
            value={selectedDate}
            max={todayStr()}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <span className="hidden text-xs text-[var(--color-muted)] sm:inline">
            {formatDateZh(selectedDate)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDateChange(addDays(selectedDate, 1))}
          disabled={isToday}
          className="rounded-lg border border-[var(--color-border)] p-2 hover:bg-[var(--color-surface-2)] disabled:opacity-40"
          aria-label="后一天"
        >
          <ChevronRight size={16} />
        </button>

        {!isToday && (
          <button
            type="button"
            onClick={() => onDateChange(todayStr())}
            className="rounded-lg border border-[var(--color-accent)]/40 px-2 py-2 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
          >
            今天
          </button>
        )}
      </div>

      {showWeekStrip && (
        <div className="flex justify-between gap-1">
          {week.map((d) => {
            const selected = d === selectedDate
            const hasLog = markedDates?.has(d)
            const dayLabel = new Date(d + 'T12:00:00').toLocaleDateString('zh-CN', { weekday: 'narrow' })
            return (
              <button
                key={d}
                type="button"
                onClick={() => onDateChange(d)}
                className={`flex flex-1 flex-col items-center rounded-lg py-2 text-xs transition-colors ${
                  selected
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                    : 'hover:bg-[var(--color-surface-2)] text-[var(--color-muted)]'
                }`}
              >
                <span>{dayLabel}</span>
                <span className="mt-0.5 font-medium">{d.slice(8)}</span>
                {hasLog && (
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
