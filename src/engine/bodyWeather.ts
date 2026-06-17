import {
  BODY_WEATHER_COPY,
  BODY_WEATHER_RULES,
  BODY_WEATHER_THRESHOLDS as T,
} from '../config/bodyWeatherRules'
import type { BodyWeatherSnapshot, BodyWeatherId } from '../types/bodyWeather'
import type { WellnessSignals } from '../lib/wellnessSignals'

type RuleMatcher = (s: WellnessSignals) => boolean

function countMildDeviations(s: WellnessSignals): number {
  let n = 0
  if (s.hrvRatio != null && s.hrvRatio < T.HRV_LOW_RATIO) n++
  if (s.rhrDelta != null && s.rhrDelta >= T.RHR_ELEVATED_BPM) n++
  if (s.sleepHours != null && s.sleepHours < T.SLEEP_OK_H) n++
  return n
}

const RULE_MATCHERS: Record<string, RuleMatcher> = {
  'BW-rainbow-01': (s) =>
    (s.yesterdayExercise ?? 0) >= T.EXERCISE_HIGH_MIN &&
    s.hrvRatio != null &&
    s.hrvRatio < T.HRV_LOW_RATIO &&
    (s.rhrDelta ?? 0) <= T.RHR_ELEVATED_BPM,

  'BW-rainy-01': (s) =>
    s.sleepHours != null &&
    s.sleepHours < T.SLEEP_SHORT_H &&
    ((s.hrvRatio != null && s.hrvRatio < T.HRV_LOW_RATIO) ||
      (s.rhrDelta != null && s.rhrDelta >= T.RHR_ELEVATED_BPM)),

  'BW-rainy-02': (s) =>
    s.sleepHours != null &&
    s.sleepHours < T.SLEEP_OK_H &&
    (s.awakeEpisodes ?? 0) >= T.AWAKE_HIGH,

  'BW-overcast-01': (s) =>
    s.hrvRatio != null &&
    s.hrvRatio < T.HRV_LOW_RATIO &&
    s.rhrDelta != null &&
    s.rhrDelta >= T.RHR_ELEVATED_BPM,

  'BW-overcast-02': (s) => s.hrvRatio != null && s.hrvRatio < T.HRV_VERY_LOW_RATIO,

  'BW-foggy-01': (s) =>
    s.hrvSdnn == null && s.rhrDelta != null && s.rhrDelta >= T.RHR_HIGH_BPM,

  'BW-foggy-02': (s) =>
    T.HRV_INTRADAY_CV_HIGH != null &&
    s.hrvIntradayCv != null &&
    s.hrvIntradayCv > T.HRV_INTRADAY_CV_HIGH,

  'BW-foggy-03': (s) =>
    s.wristTempDelta != null &&
    s.wristTempDelta >= T.TEMP_ELEVATED_C &&
    s.sleepHours != null &&
    s.sleepHours < T.SLEEP_OK_H,

  'BW-partly-01': (s) => countMildDeviations(s) === 1,

  'BW-sunny-01': (s) =>
    s.hrvRatio != null &&
    s.hrvRatio >= 0.95 &&
    (s.rhrDelta ?? 0) <= 2 &&
    s.sleepHours != null &&
    s.sleepHours >= T.SLEEP_OK_H,

  'BW-default-01': () => true,
}

function buildDebugFactors(s: WellnessSignals) {
  return [
    { signal: 'hrvRatio', value: s.hrvRatio, note: '相对 42 日 HRV 基线' },
    { signal: 'rhrDelta', value: s.rhrDelta, note: '静息心率 − 基线' },
    { signal: 'sleepHours', value: s.sleepHours, note: '睡眠时长 h' },
    { signal: 'awakeEpisodes', value: s.awakeEpisodes, note: '夜间清醒次数' },
    { signal: 'wristTempDelta', value: s.wristTempDelta, note: '手腕温度 − 基线' },
    { signal: 'yesterdayExercise', value: s.yesterdayExercise, note: '昨日运动 min' },
  ]
}

function capConfidence(
  base: 'high' | 'medium' | 'low',
  signals: WellnessSignals,
): 'high' | 'medium' | 'low' {
  const missingKey = signals.hrvSdnn == null && signals.restingHr == null
  if (missingKey) return 'low'
  if (signals.hrvSdnn == null || signals.sleepHours == null) {
    if (base === 'high') return 'medium'
  }
  return base
}

export function computeBodyWeather(signals: WellnessSignals): BodyWeatherSnapshot {
  const sorted = [...BODY_WEATHER_RULES].sort((a, b) => a.priority - b.priority)

  for (const rule of sorted) {
    const matcher = RULE_MATCHERS[rule.ruleId]
    if (!matcher?.(signals)) continue

    const copy = BODY_WEATHER_COPY[rule.weatherId as BodyWeatherId]
    const confidence = capConfidence(rule.confidence, signals)

    return {
      date: signals.date,
      weatherId: rule.weatherId,
      label: copy.label,
      metaphor: copy.metaphor,
      letterOpener: copy.letterOpener,
      confidence,
      matchedRuleId: rule.ruleId,
      debugFactors: buildDebugFactors(signals),
    }
  }

  const fallback = BODY_WEATHER_COPY.partly_cloudy
  return {
    date: signals.date,
    weatherId: 'partly_cloudy',
    label: fallback.label,
    metaphor: fallback.metaphor,
    letterOpener: fallback.letterOpener,
    confidence: 'low',
    matchedRuleId: 'BW-default-01',
    debugFactors: buildDebugFactors(signals),
  }
}
