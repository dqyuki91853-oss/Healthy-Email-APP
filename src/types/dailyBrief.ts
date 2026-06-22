import type { ConfidenceLevel } from './bodyWeather'

/** 身体能量文案档位，不用 0–100 分 */
export type EnergyLevel = 'low' | 'steady' | 'high'

export type SuitabilityActionId =
  | 'walk'
  | 'wuyin'
  | 'early_sleep'
  | 'light_meal'
  | 'rest'
  | 'circadian_gate'

export interface SuitabilityChip {
  id: SuitabilityActionId
  label: string
  /** 可选 deep link 或 scroll target */
  href?: string
}

/** FF-7 精简决策句，由 dailyBrief 派生，不单独建引擎 */
export interface DecisionHints {
  exercise: 'go' | 'light' | 'rest'
  treat: 'ok' | 'caution'
  sleep: 'early' | 'normal'
  /** 用户可见三句 heuristic */
  labels: {
    exercise: string
    treat: string
    sleep: string
  }
}

export interface DailyWeatherBrief {
  date: string
  energyLevel: EnergyLevel
  /** 如「充沛」「偏缓」「平稳」 */
  energyLabel: string
  /** 恢复概率隐喻 0–1，UI 显示为「恢复 70%」 */
  recoveryProbability: number
  recoveryLabel: string
  /** 趋势一行，如「明后天可能进入小雨段」 */
  trendHint: string
  /** 今日适宜 chip，≤3 个 */
  suitability: SuitabilityChip[]
  decisionHints: DecisionHints
  confidence: ConfidenceLevel
  matchedRuleId: string
}
