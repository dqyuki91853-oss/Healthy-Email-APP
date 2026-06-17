import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import type { EvidenceLevel } from '../../types/health'
import { CHART_GRID, CHART_TICK, CHART_TOOLTIP, CHART_REFERENCE_STRONG, CHART_REFERENCE_MODERATE, CHART_COLORS } from './chartTheme'

interface RefLine {
  value: number
  label: string
  evidence: EvidenceLevel
}

interface Props {
  data: { date: string; value: number | null }[]
  unit?: string
  color?: string
  referenceLines?: RefLine[]
  showAbsoluteThresholds?: boolean
  baselinePct?: boolean
  baseline?: number
}

export function TimeSeriesChart({
  data,
  unit = '',
  color = CHART_COLORS[0],
  referenceLines = [],
  showAbsoluteThresholds = true,
  baselinePct = false,
  baseline,
}: Props) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    value: d.value,
    pctFromBaseline:
      baselinePct && baseline && d.value != null ? ((d.value - baseline) / baseline) * 100 : d.value,
  }))

  const yKey = baselinePct ? 'pctFromBaseline' : 'value'

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
        <XAxis dataKey="date" tick={{ fill: CHART_TICK, fontSize: 11 }} />
        <YAxis tick={{ fill: CHART_TICK, fontSize: 11 }} unit={baselinePct ? '%' : unit} />
        <Tooltip
          contentStyle={{
            background: CHART_TOOLTIP.background,
            border: CHART_TOOLTIP.border,
            borderRadius: CHART_TOOLTIP.borderRadius,
          }}
          formatter={(v) => {
            const n = typeof v === 'number' ? v : Number(v)
            return [
              baselinePct ? `${n.toFixed(1)}% vs 基线` : `${n} ${unit}`,
              baselinePct ? '偏离' : '数值',
            ]
          }}
        />
        {showAbsoluteThresholds &&
          referenceLines.map((r) => (
            <ReferenceLine
              key={r.label}
              y={r.value}
              stroke={r.evidence === 'strong' ? CHART_REFERENCE_STRONG : CHART_REFERENCE_MODERATE}
              strokeDasharray="4 4"
              label={{ value: r.label, fill: CHART_TICK, fontSize: 10 }}
            />
          ))}
        <Line type="monotone" dataKey={yKey} stroke={color} dot={false} strokeWidth={2} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}
