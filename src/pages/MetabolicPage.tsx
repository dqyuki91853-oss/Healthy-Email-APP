import { useAppStore } from '../store/useAppStore'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { STEPS_THRESHOLDS, VO2_THRESHOLDS } from '../config/thresholds'
import { EvidenceBadge } from '../components/health/EvidenceBadge'
import { CHART_REFERENCE_LINES } from '../config/thresholds'
import { ReliabilityBadge } from '../components/health/ReliabilityBadge'
import { DirectionScoreCard } from '../components/health/DirectionScoreCard'
import { WatchMetricAppendix } from '../components/health/WatchMetricAppendix'

export function MetabolicPage() {
  const watchRows = useAppStore((s) => s.watchRows)
  const prediction = useAppStore((s) => s.prediction)
  const recent = watchRows.slice(-30)
  const metabolic = prediction?.directionScores.find((d) => d.direction === 'metabolic')
  const nafld = prediction?.directionScores.find((d) => d.direction === 'nafld')
  const gout = prediction?.directionScores.find((d) => d.direction === 'gout')

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">代谢健康</h2>
      <p className="text-sm text-[var(--color-muted)]">
        综合代谢综合征、NAFLD、尿酸相关代理指标与饮食模式。
        <Link to="/blood-pressure" className="ml-1 text-[var(--color-teal)] underline">
          血压与食物反应 →
        </Link>
      </p>

      {(metabolic || nafld || gout) && (
        <div className="grid gap-3 md:grid-cols-3">
          {gout && <DirectionScoreCard score={gout} />}
          {metabolic && <DirectionScoreCard score={metabolic} />}
          {nafld && <DirectionScoreCard score={nafld} />}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-2 flex justify-between">
            <h3 className="text-sm font-medium">日均步数</h3>
            <ReliabilityBadge level="reliable" />
          </div>
          <TimeSeriesChart
            data={recent.map((r) => ({ date: r.date, value: r.dailySteps }))}
            referenceLines={CHART_REFERENCE_LINES.steps}
          />
        </Card>
        <Card>
          <div className="mb-2 flex justify-between">
            <h3 className="text-sm font-medium">VO₂ max</h3>
            <ReliabilityBadge level="trend_only" />
          </div>
          <TimeSeriesChart
            data={recent.map((r) => ({ date: r.date, value: r.vo2max }))}
            unit="mL/kg/min"
            showAbsoluteThresholds={false}
          />
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-medium">步数阈值</h3>
          {STEPS_THRESHOLDS.map((t) => (
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
          <h3 className="mb-3 font-medium">VO₂ max 阈值（趋势参考）</h3>
          {VO2_THRESHOLDS.map((t) => (
            <div key={t.condition} className="mb-2 flex justify-between text-sm">
              <div>
                <p>{t.condition}</p>
                <p className="text-[var(--color-muted)]">{t.meaning}</p>
              </div>
              <EvidenceBadge level={t.evidence} />
            </div>
          ))}
        </Card>
      </div>

      <WatchMetricAppendix domain="metabolic" />
    </div>
  )
}
