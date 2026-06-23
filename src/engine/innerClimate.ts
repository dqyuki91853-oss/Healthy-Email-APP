import type { ConfidenceLevel } from '../types/bodyWeather'
import type { BpAdvisory } from '../types/bpAdvisory'
import type { InnerClimateSnapshot, InnerClimateState } from '../types/innerClimate'
import type { BloodPressureReading } from '../types/bloodPressure'
import type { VoiceExtraction } from '../types/voice'
import type { WellnessSignals } from '../lib/wellnessSignals'
import { hasElevatedPostMealBp } from '../lib/bloodPressureStore'

const STATE_LABELS: Record<InnerClimateState, string> = {
  steady: '稳',
  ripple: '微澜',
  afterglow: '余波',
}

function isHeavyEveningMeal(log: VoiceExtraction): boolean {
  const slot = log.mealSlot ?? 'unknown'
  if (slot !== 'dinner' && slot !== 'snack') return false
  return log.foods.some(
    (f) => f.portion === 'medium' || f.portion === 'large',
  )
}

function voiceLogsForDate(voiceLogs: VoiceExtraction[], targetDate: string): VoiceExtraction[] {
  return voiceLogs.filter((log) => log.recordDate === targetDate)
}

function scoreRipple(signals: WellnessSignals, voiceLogs: VoiceExtraction[]): number {
  let score = 0
  const dayLogs = voiceLogsForDate(voiceLogs, signals.date)
  if (dayLogs.some(isHeavyEveningMeal)) score += 1
  if (
    signals.stepsRatio != null &&
    signals.stepsRatio > 1.3 &&
    signals.hrvRatio != null &&
    signals.hrvRatio < 0.9
  ) {
    score += 1
  }
  return score
}

function detectAfterglow(signals: WellnessSignals): boolean {
  return (
    (signals.yesterdayExercise ?? 0) >= 45 &&
    signals.hrvRatio != null &&
    signals.hrvRatio < 0.85
  )
}

function buildHint(
  state: InnerClimateState,
  hasHeavyDinner: boolean,
  hasActivityRipple: boolean,
  bpRipple: boolean,
): string {
  if (state === 'steady') return '体内节奏比较平稳'
  if (state === 'afterglow') return '昨天的运动量还在体内收尾'
  if (bpRipple) return '某餐之后血压反应偏明显，今晚可以清淡一点'
  if (hasHeavyDinner) return '午后消化可能占一点注意力'
  if (hasActivityRipple) return '活动起伏略大，留一点缓冲'
  return '体内有些小波动，不必紧张'
}

function applyBloodPressure(
  state: InnerClimateState,
  matchedRuleId: string,
  signals: WellnessSignals,
  voiceLogs: VoiceExtraction[],
  bpReadings: BloodPressureReading[],
): {
  state: InnerClimateState
  matchedRuleId: string
  bpInformed: boolean
  customHint?: string
} {
  if (bpReadings.length === 0) {
    return { state, matchedRuleId, bpInformed: false }
  }

  const bpRipple = hasElevatedPostMealBp(signals.date, voiceLogs, bpReadings)
  const bpInformed = true

  if (!bpRipple) {
    return { state, matchedRuleId, bpInformed }
  }

  if (state === 'afterglow') {
    return { state, matchedRuleId, bpInformed }
  }

  return {
    state: 'ripple',
    matchedRuleId: 'IC-bp-ripple-01',
    bpInformed,
  }
}

function buildConfidence(
  signalCount: number,
  hasSteps: boolean,
  hasDiet: boolean,
): ConfidenceLevel {
  if (!hasDiet && !hasSteps) return 'low'
  if (signalCount >= 3) return 'high'
  if (signalCount >= 2) return 'medium'
  return 'low'
}

export function computeInnerClimate(
  signals: WellnessSignals,
  voiceLogs: VoiceExtraction[],
  bpReadings: BloodPressureReading[] = [],
  bpAdvisory?: BpAdvisory | null,
): InnerClimateSnapshot {
  const dayLogs = voiceLogsForDate(voiceLogs, signals.date)
  const hasHeavyDinner = dayLogs.some(isHeavyEveningMeal)
  const hasActivityRipple =
    signals.stepsRatio != null &&
    signals.stepsRatio > 1.3 &&
    signals.hrvRatio != null &&
    signals.hrvRatio < 0.9
  const hasSteps = signals.dailySteps != null
  const hasDiet = dayLogs.length > 0

  let state: InnerClimateState
  let matchedRuleId: string

  if (detectAfterglow(signals)) {
    state = 'afterglow'
    matchedRuleId = 'IC-afterglow-01'
  } else {
    const rippleScore = scoreRipple(signals, voiceLogs)
    if (rippleScore === 0) {
      state = 'steady'
      matchedRuleId = 'IC-steady-01'
    } else {
      state = 'ripple'
      matchedRuleId = rippleScore >= 2 ? 'IC-ripple-02' : 'IC-ripple-01'
    }
  }

  const signalCount =
    Number(hasHeavyDinner) +
    Number(hasActivityRipple) +
    Number(state === 'afterglow')

  const bpApplied = applyBloodPressure(state, matchedRuleId, signals, voiceLogs, bpReadings)
  state = bpApplied.state
  matchedRuleId = bpApplied.matchedRuleId
  const bpRipple =
    bpApplied.bpInformed && bpApplied.matchedRuleId === 'IC-bp-ripple-01'

  if (
    bpAdvisory?.fusionHints.bodyWeatherRipple &&
    state === 'steady' &&
    bpAdvisory.weatherLevel !== 'crisis'
  ) {
    state = 'ripple'
    matchedRuleId = 'IC-bp-advisory-01'
  }

  const advisoryRipple = matchedRuleId === 'IC-bp-advisory-01'

  return {
    date: signals.date,
    state,
    label: STATE_LABELS[state],
    hint:
      bpApplied.customHint ??
      (advisoryRipple
        ? '最近血压波动偏明显，今晚宜清淡、早睡'
        : buildHint(state, hasHeavyDinner, hasActivityRipple, bpRipple)),
    confidence: buildConfidence(signalCount, hasSteps, hasDiet),
    matchedRuleId,
    bpInformed: bpApplied.bpInformed,
  }
}
