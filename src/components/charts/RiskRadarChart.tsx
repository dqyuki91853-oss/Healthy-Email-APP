import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { DirectionScore } from '../../types/prediction'
import { CHART_GRID, CHART_TICK, CHART_RADAR_BASELINE, CHART_COLORS } from './chartTheme'

interface Props {
  scores: DirectionScore[]
  height?: number
}

export function RiskRadarChart({ scores, height = 360 }: Props) {
  const data = scores.map((s) => ({
    direction: s.label.replace(/ \(.*\)/, ''),
    score: s.riskScore,
    baseline: 25,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadar data={data}>
        <PolarGrid stroke={CHART_GRID} />
        <PolarAngleAxis dataKey="direction" tick={{ fill: CHART_TICK, fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: CHART_TICK, fontSize: 10 }} />
        <Radar
          name="风险评分"
          dataKey="score"
          stroke={CHART_COLORS[2]}
          fill={CHART_COLORS[2]}
          fillOpacity={0.35}
        />
        <Radar
          name="参考基线"
          dataKey="baseline"
          stroke={CHART_RADAR_BASELINE}
          fill={CHART_RADAR_BASELINE}
          fillOpacity={0.15}
          strokeDasharray="4 4"
        />
        <Legend />
      </RechartsRadar>
    </ResponsiveContainer>
  )
}
