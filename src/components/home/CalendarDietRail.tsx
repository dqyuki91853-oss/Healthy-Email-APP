import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { MiniCalendar } from '../ui/MiniCalendar'
import { getRecordDate, todayStr } from '../../lib/dates'
import { User, Plus, Apple, Utensils } from 'lucide-react'

const RECORD_BGS = ['bg-[var(--color-cream)]/40', 'bg-[var(--color-blush)]/30', 'bg-[var(--color-gold)]/15']

interface Props {
  className?: string
  compact?: boolean
}

/** 日历 + 最近饮食记录 — 桌面左栏 / 移动首页顶栏复用 */
export function CalendarDietRail({ className = '', compact = false }: Props) {
  const { profile, watchRows, voiceLogs } = useAppStore()
  const navigate = useNavigate()

  const markedDates = useMemo(() => {
    const set = new Set<string>()
    watchRows.forEach((r) => set.add(r.date))
    voiceLogs.forEach((l) => set.add(getRecordDate(l)))
    return set
  }, [watchRows, voiceLogs])

  const recentLogs = useMemo(
    () =>
      [...voiceLogs]
        .sort((a, b) => getRecordDate(b).localeCompare(getRecordDate(a)))
        .slice(0, compact ? 3 : 5),
    [voiceLogs, compact],
  )

  const nickname =
    profile.sex === 'female' ? '女士' : profile.sex === 'male' ? '先生' : '健康访客'

  return (
    <div className={`calendar-diet-rail flex flex-col ${className}`}>
      {!compact && (
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-teal)]/12">
            <User size={20} className="text-[var(--color-teal)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">你好{nickname}</p>
            <p className="text-xs text-[var(--color-muted)]">{todayStr()}</p>
          </div>
        </div>
      )}

      <div className={compact ? 'mb-4' : 'mb-5'}>
        <MiniCalendar markedDates={markedDates} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <p className="mb-2.5 text-xs font-semibold tracking-wide text-[var(--color-muted)]">
          最近饮食
        </p>

        {recentLogs.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--color-muted)]">
            暂无记录，点击 + 开始
          </p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log, i) => (
              <Link
                key={log.id}
                to="/voice-log"
                className="calendar-diet-rail__item flex items-center gap-3 rounded-2xl bg-[var(--color-surface-2)]/80 p-2.5 transition-colors hover:bg-[var(--color-cream)]/35"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${RECORD_BGS[i % 3]}`}
                >
                  {log.mealSlot === 'lunch' || log.mealSlot === 'dinner' || log.mealSlot === 'breakfast' ? (
                    <Utensils size={16} className="text-[var(--color-teal)]" />
                  ) : (
                    <Apple size={16} className="text-[var(--color-teal)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--color-text)]">
                    {log.mealSummary || log.transcript || '饮食记录'}
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    {getRecordDate(log)}
                    {log.mealSlot && log.mealSlot !== 'unknown'
                      ? ` · ${log.mealSlot === 'breakfast' ? '早餐' : log.mealSlot === 'lunch' ? '午餐' : log.mealSlot === 'dinner' ? '晚餐' : '加餐'}`
                      : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/voice-log')}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-teal)] text-white shadow-sm transition-colors hover:bg-[var(--color-coral)]"
          aria-label="添加饮食记录"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  )
}
