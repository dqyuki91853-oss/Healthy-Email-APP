import type { BpWeatherLevel } from '../types/bpAdvisory'

export const BASELINE_WINDOW_DAYS = 14

export const MORNING_HOUR_START = 6
export const MORNING_HOUR_END = 10
export const EVENING_HOUR_START = 18
export const EVENING_HOUR_END = 22

export const WEATHER_CALM_PCT = 0.05
export const WEATHER_BREEZE_PCT = 0.1
export const WEATHER_WINDY_PCT = 0.18

export const VOLATILE_CV_7D = 0.12
export const TREND_SLOPE_EPS = 0.008
export const MIN_DAYS_TREND = 3

export const CRISIS_SYS = 180
export const CRISIS_DIA = 120
export const ELEVATED_SYS = 140
export const ELEVATED_DIA = 90
export const ELEVATED_STREAK_DAYS = 3

export const MORNING_SURGE_MMHG = 8
export const MORNING_SURGE_PCT = 0.1

export const BASELINE_CONFIDENCE_HIGH = 7
export const BASELINE_CONFIDENCE_MEDIUM = 3

export const CLINICAL_DISCLAIMER = '本应用不作医学诊断，请以专业医疗意见为准。'

export const BP_WEATHER_COPY: Record<
  BpWeatherLevel,
  { label: string; hint: string }
> = {
  calm: { label: '静风', hint: '接近你的平常节奏' },
  breeze: { label: '微风', hint: '比基线略高一点，留意即可' },
  windy: { label: '有风', hint: '波动偏明显，今晚宜清淡、早睡' },
  storm: { label: '强风', hint: '连续几天偏高，放慢节奏' },
  crisis: { label: '急风', hint: '读数异常偏高，建议尽快复测并咨询医生' },
}

export const FOOD_REACTION_LABELS: Record<string, string> = {
  mild: '轻微',
  moderate: '中等',
  strong: '明显',
}
