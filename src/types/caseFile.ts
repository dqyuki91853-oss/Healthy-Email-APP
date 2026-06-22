import type { ConfidenceLevel } from './bodyWeather'

export type CaseFileStatus = 'open' | 'testing' | 'verified' | 'dismissed'

export type CaseFileKind =
  | 'weekday_pattern'
  | 'sleep_hrv_correlation'
  | 'late_dinner_sleep'
  | 'exercise_recovery'
  | 'bp_meal'

export interface CaseFileEvidence {
  label: string
  value?: string
}

export interface CaseFile {
  id: string
  /** 展示编号，如 003 */
  displayNumber: number
  kind: CaseFileKind
  title: string
  hypothesis: string
  evidence: CaseFileEvidence[]
  confidence: ConfidenceLevel
  status: CaseFileStatus
  /** ISO date，发现日 */
  discoveredAt: string
  /** 关联指标 key，供详情页图表 */
  metricKeys?: string[]
  /** 规则 id */
  ruleId: string
}

/** patternDiscovery 单次运行结果 */
export interface PatternDiscoveryResult {
  date: string
  /** 本周新生成（≤2） */
  newCases: CaseFile[]
  /** 合并持久化后的全量 open/testing/verified */
  activeCases: CaseFile[]
  /** 数据不足时为 true */
  insufficientData: boolean
  minDaysRequired: number
  daysAvailable: number
}
