import { Link } from 'react-router-dom'
import type { BpAdvisory, BpSuggestion, BpTrend, BpWeatherLevel } from '../../types/bpAdvisory'
import { Card } from '../ui/Card'

const WEATHER_CLASS: Record<BpWeatherLevel, string> = {
  calm: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  breeze: 'text-sky-700 bg-sky-50 border-sky-200',
  windy: 'text-amber-700 bg-amber-50 border-amber-200',
  storm: 'text-orange-700 bg-orange-50 border-orange-200',
  crisis: 'text-rose-700 bg-rose-50 border-rose-200',
}

const TREND_LABEL: Record<BpTrend, string> = {
  rising: '缓升',
  falling: '缓降',
  stable: '平稳',
  volatile: '波动大',
  insufficient_data: '数据不足',
}

export function BpWeatherCard({ advisory }: { advisory: BpAdvisory }) {
  const cls = WEATHER_CLASS[advisory.weatherLevel]
  return (
    <Card className={`border ${cls.split(' ').slice(1).join(' ')}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">今日血压风况</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className={`text-3xl font-semibold ${cls.split(' ')[0]}`}>
          {advisory.weatherLabel}
        </span>
        {!advisory.hasSufficientData && (
          <span className="text-xs text-[var(--color-muted)]">基线建立中</span>
        )}
      </div>
      <p className="mt-2 text-sm">{advisory.weatherHint}</p>
      {advisory.baselineDeltaSysPct != null && advisory.hasSufficientData && (
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          相对你的基线：收缩 {advisory.baselineDeltaSysPct > 0 ? '+' : ''}
          {advisory.baselineDeltaSysPct}% · 舒张{' '}
          {advisory.baselineDeltaDiaPct != null
            ? `${advisory.baselineDeltaDiaPct > 0 ? '+' : ''}${advisory.baselineDeltaDiaPct}%`
            : '—'}
        </p>
      )}
    </Card>
  )
}

export function BpLatestReading({ advisory }: { advisory: BpAdvisory }) {
  const latest = advisory.latest
  if (!latest) {
    return (
      <Card>
        <h3 className="font-medium">最新读数</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">还没有血压记录。</p>
        <Link
          to="/blood-pressure"
          className="mt-3 inline-block text-sm text-[var(--color-teal)] hover:underline"
        >
          去录入 →
        </Link>
      </Card>
    )
  }

  const time = latest.measuredAt.includes('T')
    ? latest.measuredAt.slice(0, 16).replace('T', ' ')
    : latest.measuredAt

  return (
    <Card>
      <h3 className="font-medium">最新读数</h3>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {latest.systolicMmHg}/{latest.diastolicMmHg}
        <span className="ml-1 text-sm font-normal text-[var(--color-muted)]">mmHg</span>
      </p>
      {latest.pulseBpm != null && (
        <p className="text-sm text-[var(--color-muted)]">脉搏 {latest.pulseBpm} bpm</p>
      )}
      <p className="mt-1 text-xs text-[var(--color-muted)]">{time}</p>
    </Card>
  )
}

export function BpTrendSummary({ advisory }: { advisory: BpAdvisory }) {
  return (
    <Card>
      <h3 className="font-medium">趋势摘要</h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[var(--color-muted)]">7 日</dt>
          <dd className="font-medium">{TREND_LABEL[advisory.trend7d]}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted)]">14 日</dt>
          <dd className="font-medium">{TREND_LABEL[advisory.trend14d]}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted)]">有效天数</dt>
          <dd className="font-medium">
            {advisory.daysWithReadings7d}/7 · {advisory.daysWithReadings14d}/14
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted)]">测量节律</dt>
          <dd className="font-medium">{rhythmLabel(advisory.readingRhythm)}</dd>
        </div>
        {advisory.pulsePressure != null && (
          <div className="col-span-2">
            <dt className="text-[var(--color-muted)]">脉压</dt>
            <dd className="font-medium">
              {advisory.pulsePressure} mmHg
              {advisory.pulsePressureLabel ? ` · ${advisory.pulsePressureLabel}` : ''}
            </dd>
          </div>
        )}
        {advisory.variabilityLabel && (
          <div className="col-span-2">
            <dt className="text-[var(--color-muted)]">波动</dt>
            <dd className="font-medium">{advisory.variabilityLabel}</dd>
          </div>
        )}
      </dl>
    </Card>
  )
}

function rhythmLabel(rhythm: BpAdvisory['readingRhythm']): string {
  switch (rhythm) {
    case 'morning_only':
      return '仅晨测'
    case 'evening_only':
      return '仅晚测'
    case 'mixed':
      return '晨晚混合'
    case 'single_reading':
      return '单次'
    default:
      return rhythm
  }
}

const PRIORITY_CLASS: Record<BpSuggestion['priority'], string> = {
  high: 'border-rose-200 bg-rose-50/80',
  medium: 'border-amber-200 bg-amber-50/50',
  low: 'border-[var(--color-border)] bg-[var(--color-surface-2)]/50',
}

export function BpSuggestionsList({ suggestions }: { suggestions: BpSuggestion[] }) {
  if (suggestions.length === 0) {
    return (
      <Card>
        <h3 className="font-medium">建议</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">暂无特别建议，继续保持测量习惯。</p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="mb-3 font-medium">建议</h3>
      <ul className="space-y-2">
        {suggestions.map((s) => (
          <li
            key={s.id}
            className={`rounded-lg border px-3 py-2.5 ${PRIORITY_CLASS[s.priority]}`}
          >
            <p className="text-sm font-medium">{s.label}</p>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">{s.detail}</p>
            {s.actionHref && (
              <Link
                to={s.actionHref}
                className="mt-1 inline-block text-xs text-[var(--color-teal)] hover:underline"
              >
                {s.actionLabel ?? '查看'} →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function BpFoodReactionsPanel({
  reactions,
}: {
  reactions: BpAdvisory['topFoodReactions']
}) {
  if (reactions.length === 0) return null

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">食物反应 Top 3</h3>
        <Link to="/blood-pressure" className="text-xs text-[var(--color-teal)] hover:underline">
          完整指纹 →
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {reactions.map((r) => (
          <li
            key={r.foodName}
            className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm"
          >
            <span>{r.foodName}</span>
            <span className="text-[var(--color-muted)]">
              {r.reaction} · +{Math.round(r.avgPeakDeltaPct * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function BpDataQualityNote({ advisory }: { advisory: BpAdvisory }) {
  if (advisory.hasSufficientData && !advisory.dataQuality.duplicateSuspect) return null

  return (
    <Card className="border-dashed">
      <h3 className="text-sm font-medium">数据质量</h3>
      <ul className="mt-2 space-y-1 text-xs text-[var(--color-muted)]">
        {!advisory.hasSufficientData && (
          <li>个人基线尚未稳定，建议连续测量至少 3 天。</li>
        )}
        {advisory.dataQuality.gapDays7d > 2 && (
          <li>最近 7 天有 {advisory.dataQuality.gapDays7d} 天缺少测量。</li>
        )}
        {advisory.dataQuality.duplicateSuspect && (
          <li>检测到疑似重复读数，导入时可留意去重。</li>
        )}
        <li>测量节奏得分 {Math.round(advisory.dataQuality.rhythmScore * 100)}%</li>
      </ul>
    </Card>
  )
}
