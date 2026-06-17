/** 身体天气状态 ID */
export type BodyWeatherId =
  | 'sunny'
  | 'partly_cloudy'
  | 'overcast'
  | 'rainy'
  | 'foggy'
  | 'rainbow'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface BodyWeatherSnapshot {
  date: string
  weatherId: BodyWeatherId
  /** 用户可见短标签，如「阴天」 */
  label: string
  /** 一句隐喻，首页展示 */
  metaphor: string
  /** 来信开头模板句 */
  letterOpener: string
  confidence: ConfidenceLevel
  matchedRuleId: string
  /** 仅 advancedMode */
  debugFactors?: { signal: string; value: number | null; note: string }[]
}
