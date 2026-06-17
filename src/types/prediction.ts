import type { AlertLevel, EvidenceLevel } from './health'
import type { SubhealthDirection } from './alerts'

export type MetricStatus = 'normal' | 'yellow' | 'red' | 'no_data'

export interface MetricEvaluation {
  key: string
  name: string
  unit: string
  reliability: 'reliable' | 'trend_only' | 'unreliable'
  status: MetricStatus
  detail: string
  risk: string
  evidence: EvidenceLevel
  avg7d?: number | null
}

export interface DirectionScore {
  direction: SubhealthDirection
  label: string
  riskScore: number
  maxScore: number
  level: AlertLevel
  riskItems: string[]
  recommendation: string
  actionRoute: string
}

export interface PredictionSnapshot {
  metricEvaluations: MetricEvaluation[]
  directionScores: DirectionScore[]
  overallLevel: AlertLevel
  evaluatedAt: string
}
