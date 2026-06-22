import { useAppStore } from '../store/useAppStore'
import { Card } from '../components/ui/Card'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { ReliabilityBadge } from '../components/health/ReliabilityBadge'
import { RHR_THRESHOLDS, HRV_THRESHOLDS, SPO2_THRESHOLDS } from '../config/thresholds'
import { EvidenceBadge } from '../components/health/EvidenceBadge'
import { CHART_REFERENCE_LINES } from '../config/thresholds'
import { getBaseline } from '../lib/baselines'
import { DirectionScoreCard } from '../components/health/DirectionScoreCard'
import { WatchMetricAppendix } from '../components/health/WatchMetricAppendix'

export function HeartPage() {
  const { watchRows, baselines, prediction } = useAppStore()
  const recent = watchRows.slice(-30)
  const hrvBaseline = getBaseline(baselines, 'hrvSdnn')
  const burnout = prediction?.directionScores.find((d) => d.direction === 'burnout')
  const heartMetrics = prediction?.metricEvaluations.filter((m) =>
    ['restingHr', 'hrvSdnn', 'cardioRecovery1min', 'spo2NightAvg'].includes(m.key),
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">心脏健康</h2>

      {heartMetrics && heartMetrics.length > 0 && (
        <Card>
          <h3 className="mb-3 font-medium">指标阈值状态</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {heartMetrics.map((m) => (
              <div key={m.key} className="rounded-lg border border-[var(--color-border)] p-2 text-sm">
                <div className="flex justify-between">
                  <span>{m.name}</span>
                  <EvidenceBadge level={m.evidence} />
                </div>
                <p className="text-xs text-[var(--color-muted)]">{m.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {burnout && burnout.level !== 'green' && <DirectionScoreCard score={burnout} />}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-2 flex justify-between">
            <h3 className="text-sm font-medium">静息心率</h3>
            <ReliabilityBadge level="reliable" />
          </div>
          <TimeSeriesChart
            data={recent.map((r) => ({ date: r.date, value: r.restingHr }))}
            unit="bpm"
            referenceLines={CHART_REFERENCE_LINES.rhr}
          />
        </Card>
        <Card>
          <div className="mb-2 flex justify-between">
            <h3 className="text-sm font-medium">HRV (SDNN)</h3>
            <ReliabilityBadge level="trend_only" note="AW 为短时程 PRV" />
          </div>
          <TimeSeriesChart
            data={recent.map((r) => ({ date: r.date, value: r.hrvSdnn }))}
            baselinePct
            baseline={hrvBaseline?.mean}
            showAbsoluteThresholds={false}
            color="#a78bfa"
          />
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            24h SDNN 阈值不可直接换算为 AW 短时程值；使用个人基线纵向比较
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-medium">静息心率阈值</h3>
          {RHR_THRESHOLDS.map((t) => (
            <div key={t.condition} className="mb-2 flex justify-between text-sm">
              <div>
                <p>{t.condition}</p>
                <p className="text-[var(--color-muted)]">{t.meaning}</p>
              </div>
              <EvidenceBadge level={t.evidence} />
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="mb-3 font-medium">HRV 参考（趋势用途）</h3>
          {HRV_THRESHOLDS.map((t) => (
            <div key={t.condition} className="mb-2 flex justify-between text-sm">
              <div>
                <p>{t.condition}</p>
                <p className="text-[var(--color-muted)]">{t.meaning}</p>
              </div>
              <EvidenceBadge level={t.evidence} />
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="mb-3 font-medium">SpO₂ 参考</h3>
          {SPO2_THRESHOLDS.slice(0, 4).map((t) => (
            <div key={t.condition} className="mb-2 flex justify-between text-sm">
              <div>
                <p>{t.condition}</p>
                <p className="text-[var(--color-muted)]">{t.meaning}</p>
              </div>
              <EvidenceBadge level={t.evidence} />
            </div>
          ))}
          <p className="mt-2 text-xs text-[var(--color-yellow)]">AW 低氧区精度有限，警报时建议临床血氧计核对</p>
        </Card>
      </div>

      <WatchMetricAppendix domain="heart" />
    </div>
  )
}
