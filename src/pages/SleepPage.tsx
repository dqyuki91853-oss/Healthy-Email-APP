import { useAppStore } from '../store/useAppStore'
import { Card } from '../components/ui/Card'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { ReliabilityBadge } from '../components/health/ReliabilityBadge'
import { SLEEP_THRESHOLDS, CHART_REFERENCE_LINES } from '../config/thresholds'
import { EvidenceBadge } from '../components/health/EvidenceBadge'
import { computeDerived } from '../lib/health-import/xmlParser'
import { WatchMetricAppendix } from '../components/health/WatchMetricAppendix'
import { DirectionScoreCard } from '../components/health/DirectionScoreCard'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export function SleepPage() {
  const watchRows = useAppStore((s) => s.watchRows)
  const prediction = useAppStore((s) => s.prediction)
  const recent = watchRows.slice(-14)
  const brainFog = prediction?.directionScores.find((d) => d.direction === 'brain_fog')
  const sleepMetrics = prediction?.metricEvaluations.filter((m) =>
    ['sleepHours', 'deepSleepPct', 'sleepEfficiency'].includes(m.key),
  )

  const stackData = recent.map((r) => {
    const d = computeDerived(r)
    return {
      date: r.date.slice(5),
      深度: r.deepSleepMin,
      REM: r.remSleepMin,
      核心: r.coreSleepMin,
      deepPct: d.deepSleepPct?.toFixed(0),
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">睡眠分析</h2>
        <ReliabilityBadge level="trend_only" note="深睡平均低估约 43 分钟" />
      </div>

      {sleepMetrics && sleepMetrics.length > 0 && (
        <Card>
          <h3 className="mb-3 font-medium">睡眠阈值评估</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {sleepMetrics.map((m) => (
              <div key={m.key} className="rounded-lg border border-[var(--color-border)] p-2 text-sm">
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-[var(--color-muted)]">{m.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {brainFog && brainFog.level !== 'green' && <DirectionScoreCard score={brainFog} />}

      <Card>
        <h3 className="mb-2 text-sm font-medium">睡眠时长趋势</h3>
        <TimeSeriesChart
          data={recent.map((r) => ({ date: r.date, value: r.sleepHours }))}
          unit="h"
          referenceLines={CHART_REFERENCE_LINES.sleepHours}
        />
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-medium">睡眠分期（分钟）</h3>
        <p className="mb-2 text-xs text-[var(--color-yellow)]">AW 深睡可能低估，建议追踪个人化月度变化</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stackData}>
            <XAxis dataKey="date" tick={{ fill: '#9a9a9a', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9a9a9a', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #eeeae7' }} />
            <Legend />
            <Bar dataKey="深度" stackId="a" fill="#6366f1" />
            <Bar dataKey="REM" stackId="a" fill="#63af97" />
            <Bar dataKey="核心" stackId="a" fill="#828dab" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-medium">文献阈值参考</h3>
        <div className="space-y-2">
          {SLEEP_THRESHOLDS.map((t) => (
            <div key={t.condition} className="flex items-start justify-between gap-2 text-sm">
              <div>
                <p className="font-medium">{t.condition}</p>
                <p className="text-[var(--color-muted)]">{t.meaning}</p>
              </div>
              <EvidenceBadge level={t.evidence} />
            </div>
          ))}
        </div>
      </Card>

      <WatchMetricAppendix domain="sleep" />
    </div>
  )
}
