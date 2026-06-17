import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isToday as isTodayFn,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  markedDates: Set<string>
  onDateSelect?: (date: string) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function MiniCalendar({ markedDates, onDateSelect }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const handleDateClick = (day: Date) => {
    if (onDateSelect) {
      onDateSelect(format(day, 'yyyy-MM-dd'))
    }
  }

  return (
    <div className="rounded-[20px] bg-[var(--color-surface-2)] p-4">
      {/* Month header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface)]"
          aria-label="上个月"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold">
          {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface)]"
          aria-label="下个月"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-xs text-[var(--color-muted)] py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isToday = isTodayFn(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const hasData = markedDates.has(dateStr)

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDateClick(day)}
              className={`relative flex h-8 w-8 items-center justify-center rounded-lg text-[13px] transition-colors ${
                isToday
                  ? 'bg-[var(--color-teal)] text-white font-semibold'
                  : isCurrentMonth
                    ? 'text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                    : 'text-[var(--color-muted)]/40'
              }`}
            >
              {format(day, 'd')}
              {hasData && !isToday && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--color-teal)]" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
