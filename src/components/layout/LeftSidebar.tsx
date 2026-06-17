import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { MiniCalendar } from '../ui/MiniCalendar'
import { getRecordDate, todayStr } from '../../lib/dates'
import { User, Plus, Apple, Utensils } from 'lucide-react'

const RECORD_BGS = ['bg-[var(--color-cream)]/40', 'bg-[var(--color-blush)]/30', 'bg-[var(--color-gold)]/15']

export function LeftSidebar() {
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
        .slice(0, 5),
    [voiceLogs],
  )

  const nickname =
    profile.sex === 'female' ? '女士' : profile.sex === 'male' ? '先生' : '健康访客'

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-6 lg:flex">
      {/* Block A: User profile */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-teal)]/15">
          <User size={22} className="text-[var(--color-teal)]" />
        </div>
        <div>
          <p className="text-sm font-semibold">你好{nickname}</p>
          <p className="text-xs text-[var(--color-muted)]">{todayStr()}</p>
        </div>
      </div>

      {/* Block B: MiniCalendar */}
      <div className="mb-6">
        <MiniCalendar markedDates={markedDates} />
      </div>

      {/* Block C: Recent records */}
      <div className="flex-1 overflow-auto">
        <p className="mb-3 text-xs font-medium text-[var(--color-muted)]">最近记录</p>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)] text-center py-8">
            暂无记录，点击下方 + 开始
          </p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log, i) => (
              <Link
                key={log.id}
                to="/voice-log"
                className="flex items-center gap-3 rounded-[12px] bg-[var(--color-surface-2)] p-3 transition-colors hover:bg-[var(--color-cream)]/30"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${RECORD_BGS[i % 3]}`}
                >
                  {log.mealSlot === 'lunch' || log.mealSlot === 'dinner' || log.mealSlot === 'breakfast' ? (
                    <Utensils size={18} className="text-[var(--color-teal)]" />
                  ) : (
                    <Apple size={18} className="text-[var(--color-teal)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">
                    {log.mealSummary || log.transcript || '饮食记录'}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
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

      {/* Block D: FAB */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => navigate('/voice-log')}
          className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--color-teal)] text-white transition-colors hover:bg-[var(--color-coral)]"
          aria-label="添加饮食记录"
        >
          <Plus size={22} />
        </button>
      </div>
    </aside>
  )
}
