import { useAppStore } from '../store/useAppStore'
import { Card } from '../components/ui/Card'
import { DirectionScoreCard } from '../components/health/DirectionScoreCard'
import { WatchMetricAppendix } from '../components/health/WatchMetricAppendix'

export function MentalPage() {
  const voiceLogs = useAppStore((s) => s.voiceLogs)
  const prediction = useAppStore((s) => s.prediction)
  const alerts = useAppStore((s) => s.alerts).filter((a) => ['burnout', 'mood', 'brain_fog'].includes(a.direction))
  const mood = prediction?.directionScores.find((d) => d.direction === 'mood')
  const burnout = prediction?.directionScores.find((d) => d.direction === 'burnout')
  const brainFog = prediction?.directionScores.find((d) => d.direction === 'brain_fog')

  const emotionCounts: Record<string, number> = {}
  voiceLogs.forEach((l) => {
    l.emotions.forEach((e) => {
      emotionCounts[e] = (emotionCounts[e] ?? 0) + 1
    })
  })

  const avgStress =
    voiceLogs.filter((l) => l.stressScore != null).reduce((s, l) => s + (l.stressScore ?? 0), 0) /
      (voiceLogs.filter((l) => l.stressScore != null).length || 1)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">心理与情绪</h2>
      {(mood || burnout || brainFog) && (
        <div className="grid gap-3 md:grid-cols-3">
          {mood && <DirectionScoreCard score={mood} />}
          {burnout && <DirectionScoreCard score={burnout} />}
          {brainFog && <DirectionScoreCard score={brainFog} />}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-[var(--color-muted)]">平均压力评分</p>
          <p className="text-3xl font-semibold">{voiceLogs.length ? avgStress.toFixed(1) : '—'}</p>
          <p className="text-xs text-[var(--color-muted)]">来自口述 1-10 分</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted)]">情绪记录次数</p>
          <p className="text-3xl font-semibold">{voiceLogs.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted)]">相关提醒</p>
          <p className="text-3xl font-semibold">{alerts.length}</p>
        </Card>
      </div>
      <Card>
        <h3 className="mb-3 font-medium">情绪分布</h3>
        {Object.keys(emotionCounts).length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">通过每日记录添加情绪标签</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(emotionCounts).map(([e, n]) => (
              <span key={e} className="rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-sm">
                {e} × {n}
              </span>
            ))}
          </div>
        )}
      </Card>
      {alerts.length > 0 && (
        <Card>
          <h3 className="mb-3 font-medium">心理相关提醒</h3>
          {alerts.map((a) => (
            <div key={a.id} className="mb-2 text-sm">
              <p className="font-medium">{a.title}</p>
              <p className="text-[var(--color-muted)]">{a.message}</p>
            </div>
          ))}
        </Card>
      )}

      <WatchMetricAppendix domain="mental" />
    </div>
  )
}
