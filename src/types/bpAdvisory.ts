/** 血压天气隐喻等级 */
export type BpWeatherLevel = 'calm' | 'breeze' | 'windy' | 'storm' | 'crisis'

/** 血压趋势方向 */
export type BpTrend = 'rising' | 'falling' | 'stable' | 'volatile' | 'insufficient_data'

/** 测量节律 */
export type BpRhythm = 'morning_only' | 'evening_only' | 'mixed' | 'single_reading'

/** 个人 N=1 血压基线（14 天窗口） */
export interface PersonalBpBaseline {
  computedAt: string
  windowDays: 14
  morningSysMedian: number | null
  morningDiaMedian: number | null
  eveningSysMedian: number | null
  eveningDiaMedian: number | null
  allDaySysMedian: number | null
  allDayDiaMedian: number | null
  postMealSysMedian: number | null
  pulsePressureMedian: number | null
  sampleCounts: { morning: number; evening: number; all: number; postMeal: number }
  confidence: 'low' | 'medium' | 'high'
}

/** 单日血压摘要 */
export interface DailyBpSummary {
  date: string
  sysAvg: number
  diaAvg: number
  pulseAvg?: number
  pulsePressure: number
  readingCount: number
  morningSurge: boolean
}

/** 血压建议条目 */
export interface BpSuggestion {
  id: string
  category: 'lifestyle' | 'measurement' | 'alert' | 'food'
  priority: 'low' | 'medium' | 'high'
  label: string
  detail: string
  actionHref?: string
  actionLabel?: string
}

export interface BpClinicalEscalation {
  triggered: boolean
  reason: string
  disclaimer: string
}

export interface BpDataQuality {
  rhythmScore: number
  duplicateSuspect: boolean
  gapDays7d: number
}

export interface BpFusionHints {
  bodyWeatherRipple?: boolean
  seasonModifier?: 'stable_bonus' | null
}

/** 血压建议窗口核心输出 */
export interface BpAdvisory {
  date: string
  latest: {
    systolicMmHg: number
    diastolicMmHg: number
    pulseBpm?: number
    measuredAt: string
  } | null
  baseline: PersonalBpBaseline | null
  weatherLevel: BpWeatherLevel
  weatherLabel: string
  weatherHint: string
  trend7d: BpTrend
  trend14d: BpTrend
  pulsePressure: number | null
  pulsePressureLabel: string | null
  variability7d: number | null
  variabilityLabel: string | null
  baselineDeltaSysPct: number | null
  baselineDeltaDiaPct: number | null
  daysWithReadings7d: number
  daysWithReadings14d: number
  readingRhythm: BpRhythm
  suggestions: BpSuggestion[]
  topFoodReactions: { foodName: string; reaction: string; avgPeakDeltaPct: number }[]
  clinicalEscalation: BpClinicalEscalation
  dataQuality: BpDataQuality
  fusionHints: BpFusionHints
  hasSufficientData: boolean
  confidence: 'low' | 'medium' | 'high'
}
