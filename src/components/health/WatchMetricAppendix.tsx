import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { Card } from '../ui/Card'
import { ReliabilityBadge } from './ReliabilityBadge'
import { WATCH_METRIC_INDEX, type WatchMetricIndexEntry } from '../../config/watchMetrics'
import { getReliability } from '../../config/reliability'
import type { DailyWatchRow } from '../../types/health'
import { useAdvancedMode } from '../../hooks/useAdvancedMode'
import {
  DOMAIN_APPENDIX_TITLES,
  type WatchMetricDomain,
  WATCH_METRIC_DOMAINS,
} from '../../config/watchMetricDomains'

interface Props {
  domain: WatchMetricDomain
  /** 覆盖默认分域 keys */
  metricKeys?: string[]
}

const STEADINESS_LABELS: Record<string, string> = {
  normal: '正常',
  low: '偏低',
  very_low: '很低',
}

function getEntry(key: string): WatchMetricIndexEntry | undefined {
  return WATCH_METRIC_INDEX.find((m) => m.key === key)
}

function formatScalar(value: unknown, entry: WatchMetricIndexEntry): string {
  if (value == null) return '—'
  if (entry.valueKind === 'category' && typeof value === 'string') {
    return STEADINESS_LABELS[value] ?? value
  }
  if (typeof value === 'number') {
    if (entry.unit === 'h') return `${value.toFixed(1)} h`
    if (entry.unit === '步') return `${Math.round(value)} 步`
    if (entry.unit === 'min' && entry.key !== 'sleepHours') return `${Math.round(value)} min`
    if (entry.unit === '%') return `${value.toFixed(1)}%`
    if (entry.unit === 'ms') return `${value.toFixed(0)} ms`
    if (entry.unit === 'bpm') return `${value.toFixed(0)} bpm`
    if (entry.unit === 'kcal') return `${Math.round(value)} kcal`
    if (entry.unit === 'dB') return `${value.toFixed(0)} dB`
    if (entry.unit === '°C') return `${value.toFixed(2)}°C`
    if (entry.unit === 'mL/kg/min') return `${value.toFixed(1)}`
    return String(Math.round(value * 10) / 10)
  }
  return String(value)
}

function formatRowValue(row: DailyWatchRow, entry: WatchMetricIndexEntry): string {
  const raw = row[entry.rowKey]
  if (entry.valueKind === 'array') {
    const arr = raw as number[] | undefined
    if (!arr?.length) return '—'
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length
    if (entry.key === 'spo2') return `${(avg <= 1 ? avg * 100 : avg).toFixed(0)}% (${arr.length}次)`
    return `${avg.toFixed(0)} ms (${arr.length}次)`
  }
  return formatScalar(raw, entry)
}

function daysWithData(rows: DailyWatchRow[], entry: WatchMetricIndexEntry): number {
  return rows.filter((r) => {
    const v = r[entry.rowKey]
    if (entry.valueKind === 'array') return Array.isArray(v) && v.length > 0
    return v != null
  }).length
}

export function WatchMetricAppendix({ domain, metricKeys }: Props) {
  const advanced = useAdvancedMode()
  const watchRows = useAppStore((s) => s.watchRows)
  const keys = metricKeys ?? WATCH_METRIC_DOMAINS[domain]
  const recent = useMemo(() => watchRows.slice(-14), [watchRows])
  const latest = recent[recent.length - 1]

  if (!advanced) {
    return (
      <Card className="border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/30">
        <p className="text-sm text-[var(--color-muted)]">
          开启{' '}
          <Link to="/settings" className="text-[var(--color-teal)] underline">
            设置 → 高级健康数据
          </Link>{' '}
          可查看本页 Watch 22 项分域附录（非首页数字墙）。
        </p>
      </Card>
    )
  }

  if (!latest) {
    return (
      <Card>
        <h3 className="mb-2 font-medium">{DOMAIN_APPENDIX_TITLES[domain]}</h3>
        <p className="text-sm text-[var(--color-muted)]">导入 Apple Health 数据后可查看指标附录。</p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="mb-1 font-medium">{DOMAIN_APPENDIX_TITLES[domain]}</h3>
      <p className="mb-3 text-xs text-[var(--color-muted)]">
        近 14 日最新读数 · 个人编年附录（非诊断）
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {keys.map((key) => {
          const entry = getEntry(key)
          if (!entry) return null
          const rel = getReliability(key)
          const coverage = daysWithData(recent, entry)
          return (
            <div
              key={key}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium leading-snug">{entry.label}</p>
                {rel && <ReliabilityBadge level={rel.reliability} note={rel.awNote} />}
              </div>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatRowValue(latest, entry)}
                {entry.unit && entry.valueKind !== 'array' && entry.valueKind !== 'category' && (
                  <span className="ml-1 text-xs font-normal text-[var(--color-muted)]">
                    {entry.unit}
                  </span>
                )}
              </p>
              <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                近 14 日有数据 {coverage} 天 · {latest.date}
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
