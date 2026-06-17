/**
 * 身体天气规则表骨架 — 详见 docs/body-weather-rules.md
 * 引擎实现：src/engine/bodyWeather.ts（待建）
 */
import type { BodyWeatherId } from '../types/bodyWeather'

export const BODY_WEATHER_THRESHOLDS = {
  HRV_LOW_RATIO: 0.85,
  HRV_VERY_LOW_RATIO: 0.7,
  RHR_ELEVATED_BPM: 5,
  RHR_HIGH_BPM: 8,
  SLEEP_SHORT_H: 6.0,
  SLEEP_OK_H: 7.0,
  AWAKE_HIGH: 5,
  EXERCISE_HIGH_MIN: 45,
  TEMP_ELEVATED_C: 0.3,
  /** TODO: 文献校准 */
  HRV_INTRADAY_CV_HIGH: 25,
} as const

export interface BodyWeatherRule {
  ruleId: string
  priority: number
  /** 命中后输出的天气；default 规则可为 null 由 evaluate 处理 */
  weatherId: BodyWeatherId
  confidence: 'high' | 'medium' | 'low'
  citationIds: string[]
  /** 人类可读条件，供文档与测试；运行时由 engine 实现 */
  conditionDescription: string
}

export const BODY_WEATHER_COPY: Record<
  BodyWeatherId,
  { label: string; metaphor: string; letterOpener: string }
> = {
  sunny: {
    label: '晴朗无风',
    metaphor: '身心节奏比较稳。',
    letterOpener: '今天身体像晴朗的早晨，我们可以轻松一点开始。',
  },
  partly_cloudy: {
    label: '多云',
    metaphor: '有一两处小波动，不算坏。',
    letterOpener: '今天身体像多云天，记得对自己温柔一点。',
  },
  overcast: {
    label: '阴天',
    metaphor: '恢复略慢，需要多一点耐心。',
    letterOpener: '今天身体像阴天——不算异常，只是慢了一点。',
  },
  rainy: {
    label: '阴雨',
    metaphor: '休息不足或负荷偏高。',
    letterOpener: '今天外面下雨，你的身体里也是——我们撑伞慢慢走就好。',
  },
  foggy: {
    label: '薄雾',
    metaphor: '信号不全或波动较大。',
    letterOpener: '今天像薄雾天，看不太清全貌，先休息、先呼吸就好。',
  },
  rainbow: {
    label: '雨后彩虹',
    metaphor: '可能在运动后慢慢恢复。',
    letterOpener: '昨天辛苦了一下，今天像雨后的彩虹，正在慢慢放晴。',
  },
}

/** 按 priority 升序排列（数字越小越优先） */
export const BODY_WEATHER_RULES: BodyWeatherRule[] = [
  {
    ruleId: 'BW-rainbow-01',
    priority: 10,
    weatherId: 'rainbow',
    confidence: 'medium',
    citationIds: ['RECOVERY-HRV-001'],
    conditionDescription:
      'yesterdayExercise >= EXERCISE_HIGH AND hrvRatio < HRV_LOW AND rhrDelta <= RHR_ELEVATED',
  },
  {
    ruleId: 'BW-rainy-01',
    priority: 20,
    weatherId: 'rainy',
    confidence: 'medium',
    citationIds: ['SLEEP-ANX-001', 'HRV-STRESS-001'],
    conditionDescription:
      'sleepHours < SLEEP_SHORT AND (hrvRatio < HRV_LOW OR rhrDelta >= RHR_ELEVATED)',
  },
  {
    ruleId: 'BW-rainy-02',
    priority: 21,
    weatherId: 'rainy',
    confidence: 'medium',
    citationIds: [],
    conditionDescription: 'sleepHours < SLEEP_OK AND awakeEpisodes >= AWAKE_HIGH',
  },
  {
    ruleId: 'BW-overcast-01',
    priority: 30,
    weatherId: 'overcast',
    confidence: 'medium',
    citationIds: ['HRV-STRESS-001', 'RHR-SLEEP-001'],
    conditionDescription: 'hrvRatio < HRV_LOW AND rhrDelta >= RHR_ELEVATED',
  },
  {
    ruleId: 'BW-overcast-02',
    priority: 31,
    weatherId: 'overcast',
    confidence: 'medium',
    citationIds: ['HRV-STRESS-001'],
    conditionDescription: 'hrvRatio < HRV_VERY_LOW',
  },
  {
    ruleId: 'BW-foggy-01',
    priority: 40,
    weatherId: 'foggy',
    confidence: 'low',
    citationIds: ['HRV-WEAR-001'],
    conditionDescription: 'hrvSdnn missing AND rhrDelta >= RHR_HIGH',
  },
  {
    ruleId: 'BW-foggy-02',
    priority: 41,
    weatherId: 'foggy',
    confidence: 'low',
    citationIds: [],
    conditionDescription: 'hrvIntradayCv > HRV_INTRADAY_CV_HIGH',
  },
  {
    ruleId: 'BW-foggy-03',
    priority: 42,
    weatherId: 'foggy',
    confidence: 'low',
    citationIds: ['TEMP-SLEEP-001'],
    conditionDescription: 'wristTempDelta >= TEMP_ELEVATED AND sleepHours < SLEEP_OK',
  },
  {
    ruleId: 'BW-partly-01',
    priority: 50,
    weatherId: 'partly_cloudy',
    confidence: 'medium',
    citationIds: [],
    conditionDescription: 'exactly one of: hrv low, rhr elevated, sleep short',
  },
  {
    ruleId: 'BW-sunny-01',
    priority: 60,
    weatherId: 'sunny',
    confidence: 'medium',
    citationIds: [],
    conditionDescription: 'hrvRatio >= 0.95 AND rhrDelta <= 2 AND sleepHours >= SLEEP_OK',
  },
  {
    ruleId: 'BW-default-01',
    priority: 99,
    weatherId: 'partly_cloudy',
    confidence: 'low',
    citationIds: [],
    conditionDescription: 'fallback',
  },
]
