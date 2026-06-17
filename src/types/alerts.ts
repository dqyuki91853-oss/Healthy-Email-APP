import type { AlertLevel, EvidenceLevel } from './health'

export type SubhealthDirection =
  | 'gout'
  | 'metabolic'
  | 'nafld'
  | 'iron_deficiency'
  | 'ibs'
  | 'burnout'
  | 'mood'
  | 'brain_fog'
  | 'women_health'

export interface HealthAlert {
  id: string
  direction: SubhealthDirection
  level: AlertLevel
  title: string
  message: string
  triggeredSignals: string[]
  recommendations?: string[]
  actionRoute?: string
  evidenceLevel?: EvidenceLevel
  metricKey?: string
  createdAt: string
  acknowledged: boolean
  disclaimer: string
}

export const ALERT_DISCLAIMER =
  '本应用仅提供风险提示与关注建议，不构成医学诊断。如有不适请及时就医。'
