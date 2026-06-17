import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useAppStore } from '../../store/useAppStore'
import { normalizeSeries } from '../../lib/chartNormalize'
import { CHART_TOOLTIP } from '../charts/chartTheme'

const RANGE_OPTIONS = [
  { key: '7', label: '7天' },
  { key: '14', label: '14天' },
  { key: '30', label: '30天' },
]

interface Props {
  compact?: boolean
  /** 'panel' = large chart for homepage (240–280px, Legend, range pills) */
  variant?: 'panel' | 'compact'
}

export function WeeklyActivitySection({ compact = false, variant }: Props) {
  // Resolve compact from variant if not explicitly set
  const isCompact = variant === 'compact' || (compact && !variant)
  const isPanel = variant === 'panel'
  const { watchRows } = useAppStore()
  const [range, setRange] = useState('7')

  const chartData = useMemo(() => {
    const days = parseInt(range, 10)
    const recent = watchRows.slice(-days)

    if (isCompact || isPanel) {
      // Normalize each series independently for visible waveforms
      const stepsRaw = recent.map((r) => r.dailySteps ?? null)
      const sleepRaw = recent.map((r) => r.sleepHours ?? null)
      const exerciseRaw = recent.map((r) => r.exerciseMinutes ?? null)

      const stepsNorm = normalizeSeries(stepsRaw)
      const sleepNorm = normalizeSeries(sleepRaw)
      const exerciseNorm = normalizeSeries(exerciseRaw)

      return recent.map((r, i) => ({
        date: r.date.slice(5),
        步数: stepsNorm[i],
        睡眠: sleepNorm[i],
        运动: exerciseNorm[i],
        // Real values for tooltip display
        _real_步数: stepsRaw[i],
        _real_睡眠: sleepRaw[i],
        _real_运动: exerciseRaw[i],
      }))
    }

    return recent.map((r) => ({
      date: r.date.slice(5),
      步数: r.dailySteps ?? null,
      睡眠: r.sleepHours ?? null,
      运动: r.exerciseMinutes ?? null,
    }))
  }, [watchRows, range, isCompact, isPanel])

  const height = isPanel ? 220 : isCompact ? 180 : 280
  const showLegend = isPanel || !isCompact
  const showRangePills = isPanel || !isCompact
  const showDots = isPanel || isCompact
  const hideYAxis = isPanel || isCompact

  return (
    <div
      className={isPanel ? 'activity-panel-v3' : 'rounded-[20px] bg-[var(--color-surface)] p-6'}
      style={isPanel ? undefined : { boxShadow: 'var(--shadow-card)' }}
    >
      <style>{isPanel ? panelStyles : ''}</style>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {isPanel ? '本周活动 / Weekly Activity' : isCompact ? '本周活动' : 'Weekly Activity / 本周活动'}
        </h3>
        {showRangePills && (
          <div className="inline-flex rounded-[999px] bg-[var(--color-surface-2)] p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRange(opt.key)}
                className={`rounded-[999px] px-3 py-1 text-[13px] transition-colors ${
                  range === opt.key
                    ? 'bg-[var(--color-text)] text-white'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D4" />
          <XAxis dataKey="date" tick={{ fill: '#8A8A8A', fontSize: 11 }} />
          {hideYAxis ? (
            <YAxis hide domain={[0, 100]} />
          ) : (
            <YAxis tick={{ fill: '#8A8A8A', fontSize: 10 }} width={36} />
          )}
          <Line
            type="monotone"
            dataKey="步数"
            stroke="#63AD96"
            strokeWidth={isPanel ? 2.5 : 2}
            dot={showDots ? { r: 3, fill: '#63AD96', strokeWidth: 0 } : false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="睡眠"
            stroke="#EBC97F"
            strokeWidth={2}
            strokeDasharray={isPanel ? '4 2' : undefined}
            dot={showDots ? { r: 3, fill: '#EBC97F', strokeWidth: 0 } : false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="运动"
            stroke="#DD7C64"
            strokeWidth={isPanel ? 2.5 : 2}
            dot={showDots ? { r: 3, fill: '#DD7C64', strokeWidth: 0 } : false}
            connectNulls
          />
          <Tooltip
            contentStyle={{
              background: CHART_TOOLTIP.background,
              border: CHART_TOOLTIP.border,
              borderRadius: CHART_TOOLTIP.borderRadius,
              fontSize: 13,
              padding: '10px 14px',
              boxShadow: '0 4px 16px rgba(44,44,44,0.08)',
            }}
            labelFormatter={(label) => `日期：${label}`}
            formatter={(_value, name, props) => {
              const label = String(name ?? '')
              // In normalized mode, read real value from _real_ prefixed field
              const realKey = `_real_${label}`
              const raw =
                props.payload && typeof props.payload === 'object' && realKey in props.payload
                  ? (props.payload as Record<string, unknown>)[realKey]
                  : _value
              const v = typeof raw === 'number' ? raw : null
              if (v == null) return ['—', label]
              switch (label) {
                case '步数':
                  return [`${v.toLocaleString()} 步`, label]
                case '睡眠':
                  return [`${v.toFixed(1)} h`, label]
                case '运动':
                  return [`${v} min`, label]
                default:
                  return [String(v), label]
              }
            }}
            cursor={{ stroke: '#E8E0D4', strokeDasharray: '3 3', strokeWidth: 1 }}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              iconType="rect"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const panelStyles = `
.activity-panel-v3 {
  min-height: 0;
  background: #FFFFFF;
  border-radius: 24px;
  padding: 20px 24px;
  box-shadow: 0 4px 24px rgba(44,44,44,0.06);
  display: flex;
  flex-direction: column;
}
`
