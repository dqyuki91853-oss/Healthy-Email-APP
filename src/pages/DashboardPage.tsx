import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/layout/PageHeader'
import { WeeklyActivitySection } from '../components/home/WeeklyActivitySection'
import { Card } from '../components/ui/Card'

export function DashboardPage() {
  const { watchRows } = useAppStore()

  const stats = useMemo(() => {
    const recent = watchRows.slice(-7)
    const avgSteps = recent.length
      ? Math.round(recent.reduce((s, r) => s + (r.dailySteps ?? 0), 0) / recent.length)
      : 0
    const avgSleep = recent.length
      ? recent.reduce((s, r) => s + (r.sleepHours ?? 0), 0) / recent.length
      : 0
    const avgExercise = recent.length
      ? Math.round(recent.reduce((s, r) => s + (r.exerciseMinutes ?? 0), 0) / recent.length)
      : 0

    return { avgSteps, avgSleep, avgExercise }
  }, [watchRows])

  return (
    <div className="space-y-6">
      <PageHeader
        title="数据"
        subtitle="最近 7 天活动摘要"
      />

      {/* Summary numbers */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-[var(--color-muted)]">日均步数</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-teal)]">
            {stats.avgSteps.toLocaleString()}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-muted)]">日均睡眠</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-gold)]">
            {stats.avgSleep.toFixed(1)}h
          </p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-muted)]">日均运动</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-coral)]">
            {stats.avgExercise}min
          </p>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <WeeklyActivitySection />
    </div>
  )
}
