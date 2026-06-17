import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { getRecordDate, todayStr } from '../../lib/dates'
import { User, ArrowRight } from 'lucide-react'

export function RightPanel() {
  const location = useLocation()
  const { watchRows, voiceLogs, profile } = useAppStore()

  // Only show on home + dashboard
  const show = location.pathname === '/' || location.pathname === '/dashboard'
  if (!show) return null

  // Recent activity
  const recent = watchRows.slice(-7)
  const avgSteps = recent.length
    ? Math.round(recent.reduce((s, r) => s + (r.dailySteps ?? 0), 0) / recent.length)
    : 0
  const avgSleep = recent.length
    ? (recent.reduce((s, r) => s + (r.sleepHours ?? 0), 0) / recent.length).toFixed(1)
    : '0'
  const avgExercise = recent.length
    ? Math.round(recent.reduce((s, r) => s + (r.exerciseMinutes ?? 0), 0) / recent.length)
    : 0

  // Latest 3 diet records
  const recentLogs = [...voiceLogs]
    .sort((a, b) => getRecordDate(b).localeCompare(getRecordDate(a)))
    .slice(0, 3)

  return (
    <aside className="hidden w-80 shrink-0 overflow-auto border-l border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:block">
      {/* User greeting */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-cream)]">
          <User size={20} className="text-[var(--color-teal)]" />
        </div>
        <div>
          <p className="text-sm font-medium">
            你好{profile.sex === 'female' ? '女士' : profile.sex === 'male' ? '先生' : ''}
          </p>
          <p className="text-xs text-[var(--color-muted)]">{todayStr()}</p>
        </div>
      </div>

      {/* Activity summary */}
      <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] p-4">
        <p className="mb-3 text-xs font-medium text-[var(--color-muted)]">本周活动摘要</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-semibold text-[var(--color-teal)]">
              {avgSteps.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--color-muted)]">步数/日</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--color-gold)]">{avgSleep}h</p>
            <p className="text-xs text-[var(--color-muted)]">睡眠</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--color-coral)]">{avgExercise}min</p>
            <p className="text-xs text-[var(--color-muted)]">运动</p>
          </div>
        </div>
      </div>

      {/* Recent diet quick entry */}
      {recentLogs.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-muted)]">最近饮食</p>
            <Link to="/diet" className="flex items-center gap-1 text-xs text-[var(--color-teal)]">
              查看全部 <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <Link
                key={log.id}
                to="/diet"
                className="block rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] p-2 text-xs transition-colors hover:bg-[var(--color-cream)]/40"
              >
                <p className="truncate font-medium">{log.mealSummary || log.transcript}</p>
                <p className="mt-0.5 text-[var(--color-muted)]">{getRecordDate(log)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recentLogs.length === 0 && (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-2)] p-4 text-center">
          <p className="text-xs text-[var(--color-muted)]">暂无饮食记录</p>
          <Link
            to="/voice-log"
            className="mt-2 inline-block text-xs font-medium text-[var(--color-teal)]"
          >
            开始记录 →
          </Link>
        </div>
      )}
    </aside>
  )
}
