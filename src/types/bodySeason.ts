import type { ConfidenceLevel } from './bodyWeather'

export type BodySeasonId = 'spring' | 'summer' | 'autumn' | 'winter'

export interface BodySeasonSnapshot {
  date: string
  seasonId: BodySeasonId
  /** 春/夏/秋/冬 */
  label: string
  metaphor: string
  /** 3 条生活建议，非诊断 */
  suggestions: string[]
  /** 相对基线的综合漂移 0–1 */
  driftScore: number
  confidence: ConfidenceLevel
  /** 相对上次持久化 seasonId 是否刚更替 */
  justChanged: boolean
  previousSeasonId: BodySeasonId | null
  /** 基线成熟度不足时降级 */
  baselineMaturityDays: number
}

export interface BodySeasonHistoryEntry {
  seasonId: BodySeasonId
  startedAt: string
  endedAt: string | null
}
