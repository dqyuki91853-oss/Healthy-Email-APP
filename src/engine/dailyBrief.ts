import { WUYIN_TONES } from '../config/wuyinToneMap'
import type { BodyWeatherSnapshot } from '../types/bodyWeather'
import type {
  DailyWeatherBrief,
  DecisionHints,
  EnergyLevel,
  SuitabilityChip,
} from '../types/dailyBrief'
import type { InnerClimateSnapshot } from '../types/innerClimate'
import type { BloodPressureReading } from '../types/bloodPressure'
import type { BpAdvisory } from '../types/bpAdvisory'
import type { DailyWatchRow, PersonalBaseline } from '../types/health'
import type { MoodInferenceResult } from '../types/mood'
import type { PersonalCircadianPlan, WuyinPrescription } from '../types/tcm'
import type { VoiceExtraction } from '../types/voice'
import {
  buildWellnessSignals,
  countConsecutiveDays,
  getYesterdayRow,
  type WellnessSignals,
} from '../lib/wellnessSignals'
import { getBaseline } from '../lib/baselines'
import { hasElevatedPostMealBp } from '../lib/bloodPressureStore'

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function computeEnergy(signals: WellnessSignals): { level: EnergyLevel; label: string } {
  const hrv = signals.hrvRatio
  const sleep = signals.sleepHours

  if (hrv != null && hrv >= 0.95 && sleep != null && sleep >= 7) {
    return { level: 'high', label: '充沛' }
  }
  if ((hrv != null && hrv < 0.85) || (sleep != null && sleep < 6)) {
    return { level: 'low', label: '偏缓' }
  }
  return { level: 'steady', label: '平稳' }
}

function computeRecoveryProbability(
  signals: WellnessSignals,
  bodyWeather: BodyWeatherSnapshot,
  innerClimate: InnerClimateSnapshot | null,
): number {
  let p = clamp(signals.hrvRatio ?? 0.85, 0.35, 0.95)
  if (bodyWeather.weatherId === 'rainy') p -= 0.15
  if (innerClimate?.state === 'afterglow') p -= 0.10
  return clamp(p, 0.35, 0.95)
}

function computeHrvTrendSlope(
  rows: DailyWatchRow[],
  baselines: PersonalBaseline[],
  targetDate: string,
): number | null {
  const endIdx = rows.findIndex((r) => r.date === targetDate)
  if (endIdx < 0) return null

  const ratios: number[] = []
  for (let i = Math.max(0, endIdx - 2); i <= endIdx; i++) {
    const row = rows[i]
    const yesterday = i > 0 ? rows[i - 1] : null
    const sig = buildWellnessSignals(row, yesterday, baselines)
    if (sig.hrvRatio != null) ratios.push(sig.hrvRatio)
  }

  if (ratios.length < 2) return null
  return (ratios[ratios.length - 1] - ratios[0]) / (ratios.length - 1)
}

function computeTrendHint(
  rows: DailyWatchRow[],
  baselines: PersonalBaseline[],
  targetDate: string,
): string {
  const slope = computeHrvTrendSlope(rows, baselines, targetDate)
  if (slope == null) return '接下来几天大概维持现状'
  if (slope < -0.05) return '明后天可能进入小雨段'
  if (slope > 0.05) return '恢复力在往上走'
  return '接下来几天大概维持现状'
}

function buildSuitabilityChips(
  energy: EnergyLevel,
  bodyWeather: BodyWeatherSnapshot,
  innerClimate: InnerClimateSnapshot | null,
  wuyin: WuyinPrescription | null,
  circadian: PersonalCircadianPlan,
  signals: WellnessSignals,
  baselines: PersonalBaseline[],
): SuitabilityChip[] {
  const candidates: SuitabilityChip[] = []

  if (wuyin?.toneId) {
    const toneLabel = WUYIN_TONES[wuyin.toneId].label
    candidates.push({
      id: 'wuyin',
      label: `适合跟哼${toneLabel}音`,
      href: '/practice/wuyin',
    })
  }

  if (circadian.minutesUntilGate <= 120) {
    candidates.push({ id: 'circadian_gate', label: '适合收工' })
  }

  const stepsBase = getBaseline(baselines, 'dailySteps')
  const stepsMature = (stepsBase?.maturityDays ?? 0) >= 14
  if (energy !== 'low' && stepsMature) {
    candidates.push({ id: 'walk', label: '适合散步' })
  }

  if (
    (signals.sleepHours != null && signals.sleepHours < 6.5) ||
    bodyWeather.weatherId === 'rainy' ||
    bodyWeather.weatherId === 'overcast'
  ) {
    candidates.push({ id: 'early_sleep', label: '适合早睡' })
  }

  if (innerClimate?.state === 'ripple') {
    candidates.push({ id: 'light_meal', label: '晚餐清淡些' })
  }

  return candidates.slice(0, 3)
}

function buildDecisionHints(
  recoveryProbability: number,
  innerClimate: InnerClimateSnapshot | null,
  signals: WellnessSignals,
  rows: DailyWatchRow[],
  targetDate: string,
  voiceLogs: VoiceExtraction[],
  bpReadings: BloodPressureReading[],
): DecisionHints {
  const exercise: DecisionHints['exercise'] =
    recoveryProbability < 0.5 ? 'rest' : recoveryProbability < 0.7 ? 'light' : 'go'

  let treat: DecisionHints['treat'] = 'ok'
  if (innerClimate?.state === 'ripple') {
    if (
      innerClimate.bpInformed &&
      hasElevatedPostMealBp(targetDate, voiceLogs, bpReadings, 'lunch')
    ) {
      treat = 'caution'
    } else if (!innerClimate.bpInformed) {
      treat = 'ok'
    }
  }

  const shortSleepStreak = countConsecutiveDays(
    rows,
    targetDate,
    (r) => r.sleepHours != null && r.sleepHours < 6.5,
    2,
  )
  const sleep: DecisionHints['sleep'] =
    (signals.sleepHours != null && signals.sleepHours < 6.5) || shortSleepStreak >= 2
      ? 'early'
      : 'normal'

  const exerciseLabels = {
    rest: '今晚缓一缓',
    light: '轻度动一动可以',
    go: '动一动没问题',
  } as const

  const treatLabels = {
    ok: '解解馋可以',
    caution: '奶茶慎重',
  } as const

  const sleepLabels = {
    early: '早点睡更好',
    normal: '作息照常',
  } as const

  return {
    exercise,
    treat,
    sleep,
    labels: {
      exercise: exerciseLabels[exercise],
      treat: treatLabels[treat],
      sleep: sleepLabels[sleep],
    },
  }
}

function briefConfidence(signals: WellnessSignals): DailyWeatherBrief['confidence'] {
  const known =
    Number(signals.hrvRatio != null) +
    Number(signals.sleepHours != null) +
    Number(signals.dailySteps != null)
  if (known >= 3) return 'high'
  if (known >= 2) return 'medium'
  return 'low'
}

export function computeDailyBrief(
  signals: WellnessSignals,
  bodyWeather: BodyWeatherSnapshot,
  innerClimate: InnerClimateSnapshot | null,
  _mood: MoodInferenceResult,
  wuyin: WuyinPrescription | null,
  circadian: PersonalCircadianPlan,
  rows: DailyWatchRow[],
  baselines: PersonalBaseline[],
  voiceLogs: VoiceExtraction[] = [],
  bpReadings: BloodPressureReading[] = [],
  bpAdvisory?: BpAdvisory | null,
): DailyWeatherBrief {
  const { level: energyLevel, label: energyLabel } = computeEnergy(signals)
  const recoveryProbability = computeRecoveryProbability(signals, bodyWeather, innerClimate)
  const recoveryPct = Math.round(recoveryProbability * 100)

  let trendHint = computeTrendHint(rows, baselines, signals.date)
  if (bpAdvisory?.clinicalEscalation.triggered) {
    trendHint = `${trendHint}；血压读数偏高，建议尽快复测。`
  }

  return {
    date: signals.date,
    energyLevel,
    energyLabel,
    recoveryProbability,
    recoveryLabel: `恢复 ${recoveryPct}%`,
    trendHint,
    suitability: buildSuitabilityChips(
      energyLevel,
      bodyWeather,
      innerClimate,
      wuyin,
      circadian,
      signals,
      baselines,
    ),
    decisionHints: buildDecisionHints(
      recoveryProbability,
      innerClimate,
      signals,
      rows,
      signals.date,
      voiceLogs,
      bpReadings,
    ),
    confidence: briefConfidence(signals),
    matchedRuleId: `DB-energy-${energyLevel}`,
  }
}

/** Re-export for tests that need yesterday context */
export function computeDailyBriefForDate(
  rows: DailyWatchRow[],
  baselines: PersonalBaseline[],
  targetDate: string,
  bodyWeather: BodyWeatherSnapshot,
  innerClimate: InnerClimateSnapshot | null,
  mood: MoodInferenceResult,
  wuyin: WuyinPrescription | null,
  circadian: PersonalCircadianPlan,
): DailyWeatherBrief {
  const todayRow = rows.find((r) => r.date === targetDate)
  if (!todayRow) {
    throw new Error(`No watch row for ${targetDate}`)
  }
  const yesterday = getYesterdayRow(rows, targetDate)
  const signals = buildWellnessSignals(todayRow, yesterday, baselines)
  return computeDailyBrief(
    signals,
    bodyWeather,
    innerClimate,
    mood,
    wuyin,
    circadian,
    rows,
    baselines,
  )
}
