import type { ConfidenceLevel } from './bodyWeather'

/** 内部气候三态：饮食 + 活动 +（可选）血压合成，不上数字 */
export type InnerClimateState = 'steady' | 'ripple' | 'afterglow'

export interface InnerClimateSnapshot {
  date: string
  state: InnerClimateState
  /** 用户可见短标签，如「微澜」「稳」「余波」 */
  label: string
  /** 一句叙事，如「某餐之后血压反应偏明显」 */
  hint: string
  confidence: ConfidenceLevel
  /** 规则命中 id，便于调试 */
  matchedRuleId: string
  /** 是否接入了血压测量数据 */
  bpInformed: boolean
}
