import { Link } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { getRecordDate } from '../../lib/dates'

export function MessagesWidget() {
  const { voiceLogs } = useAppStore()

  const recentLogs = [...voiceLogs]
    .sort((a, b) => getRecordDate(b).localeCompare(getRecordDate(a)))
    .slice(0, 3)

  return (
    <div
      className="rounded-[20px] bg-[var(--color-surface)] p-5"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <h3 className="mb-4 text-sm font-semibold">最近饮食</h3>

      {recentLogs.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-[var(--color-muted)]">还没有饮食记录</p>
          <Link
            to="/voice-log"
            className="mt-1 inline-block text-xs font-medium text-[var(--color-teal)]"
          >
            去记录 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recentLogs.map((log) => {
            const firstFood = log.foods[0]
            const initial = (log.mealSummary || log.transcript || '饮').charAt(0)
            return (
              <Link
                key={log.id}
                to="/voice-log"
                className="flex items-center gap-3 rounded-[12px] p-2 transition-colors hover:bg-[var(--color-surface-2)]"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-blush)]/30 text-sm font-semibold text-[var(--color-teal)]"
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">
                    {log.mealSummary || firstFood?.name || '饮食记录'}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">{getRecordDate(log)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
