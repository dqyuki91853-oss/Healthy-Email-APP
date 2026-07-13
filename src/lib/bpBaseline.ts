import {
  BASELINE_CONFIDENCE_HIGH,
  BASELINE_CONFIDENCE_MEDIUM,
  BASELINE_WINDOW_DAYS,
  EVENING_HOUR_END,
  EVENING_HOUR_START,
  MORNING_HOUR_END,
  MORNING_HOUR_START,
  MORNING_SURGE_MMHG,
  MORNING_SURGE_PCT,
} from '../config/bpAdvisoryRules'
import { POST_MEAL_WINDOW_MS, personalPostMealSystolicMedian } from './bloodPressureStore'
import type { BloodPressureReading, BpMeasurementContext } from '../types/bloodPressure'
import type { DailyBpSummary, PersonalBpBaseline } from '../types/bpAdvisory'
import type { VoiceExtraction } from '../types/voice'

function median(vals: number[]): number | null {
  if (vals.length === 0) return null
  const sorted = [...vals].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function avg(vals: number[]): number | null {
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function hourOf(iso: string): number {
  return new Date(iso).getHours()
}

function isMorning(iso: string): boolean {
  const h = hourOf(iso)
  return h >= MORNING_HOUR_START && h < MORNING_HOUR_END
}

function isEvening(iso: string): boolean {
  const h = hourOf(iso)
  return h >= EVENING_HOUR_START && h < EVENING_HOUR_END
}

function isPostMealReading(reading: BloodPressureReading, voiceLogs: VoiceExtraction[]): boolean {
  const t = new Date(reading.measuredAt).getTime()
  if (Number.isNaN(t)) return false
  for (const log of voiceLogs) {
    const start = new Date(log.timestamp).getTime()
    if (Number.isNaN(start)) continue
    if (t >= start && t <= start + POST_MEAL_WINDOW_MS) return true
  }
  return false
}

export function deriveMeasurementContext(
  reading: BloodPressureReading,
  voiceLogs: VoiceExtraction[],
): BpMeasurementContext {
  if (isPostMealReading(reading, voiceLogs)) return 'post_meal'
  if (isMorning(reading.measuredAt)) return 'morning'
  if (isEvening(reading.measuredAt)) return 'evening'
  const h = hourOf(reading.measuredAt)
  if (h >= 10 && h < 18) return 'rest'
  return 'unknown'
}

function dateStr(iso: string): string {
  return iso.slice(0, 10)
}

function offsetDateStr(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function readingsInWindow(
  readings: BloodPressureReading[],
  endDate: string,
  windowDays: number,
): BloodPressureReading[] {
  const start = offsetDateStr(endDate, -(windowDays - 1))
  return readings.filter((r) => {
    const d = dateStr(r.measuredAt)
    return d >= start && d <= endDate
  })
}

function baselineConfidence(allCount: number): PersonalBpBaseline['confidence'] {
  if (allCount >= BASELINE_CONFIDENCE_HIGH) return 'high'
  if (allCount >= BASELINE_CONFIDENCE_MEDIUM) return 'medium'
  return 'low'
}

export function buildPersonalBpBaseline(
  readings: BloodPressureReading[],
  voiceLogs: VoiceExtraction[],
  targetDate: string,
): PersonalBpBaseline {
  const windowReadings = readingsInWindow(readings, targetDate, BASELINE_WINDOW_DAYS)

  const morningSys: number[] = []
  const morningDia: number[] = []
  const eveningSys: number[] = []
  const eveningDia: number[] = []
  const allSys: number[] = []
  const allDia: number[] = []
  const pulsePressures: number[] = []

  for (const r of windowReadings) {
    const ctx = deriveMeasurementContext(r, voiceLogs)
    allSys.push(r.systolicMmHg)
    allDia.push(r.diastolicMmHg)
    pulsePressures.push(r.systolicMmHg - r.diastolicMmHg)
    if (ctx === 'morning') {
      morningSys.push(r.systolicMmHg)
      morningDia.push(r.diastolicMmHg)
    }
    if (ctx === 'evening') {
      eveningSys.push(r.systolicMmHg)
      eveningDia.push(r.diastolicMmHg)
    }
  }

  const postMealMed = personalPostMealSystolicMedian(voiceLogs, windowReadings)
  const allCount = allSys.length

  return {
    computedAt: new Date().toISOString(),
    windowDays: BASELINE_WINDOW_DAYS,
    morningSysMedian: median(morningSys),
    morningDiaMedian: median(morningDia),
    eveningSysMedian: median(eveningSys),
    eveningDiaMedian: median(eveningDia),
    allDaySysMedian: median(allSys),
    allDayDiaMedian: median(allDia),
    postMealSysMedian: postMealMed,
    pulsePressureMedian: median(pulsePressures),
    sampleCounts: {
      morning: morningSys.length,
      evening: eveningSys.length,
      all: allCount,
      postMeal: postMealMed != null ? voiceLogs.length : 0,
    },
    confidence: baselineConfidence(allCount),
  }
}

function morningEveningAvgs(
  dayReadings: BloodPressureReading[],
  voiceLogs: VoiceExtraction[],
): { morningSys: number | null; eveningSys: number | null } {
  const morningSysVals: number[] = []
  const eveningSysVals: number[] = []
  for (const r of dayReadings) {
    const ctx = deriveMeasurementContext(r, voiceLogs)
    if (ctx === 'morning') morningSysVals.push(r.systolicMmHg)
    if (ctx === 'evening') eveningSysVals.push(r.systolicMmHg)
  }
  return { morningSys: avg(morningSysVals), eveningSys: avg(eveningSysVals) }
}

export function buildDailyBpSummaries(
  readings: BloodPressureReading[],
  voiceLogs: VoiceExtraction[],
  targetDate: string,
  windowDays = BASELINE_WINDOW_DAYS,
): DailyBpSummary[] {
  const summaries: DailyBpSummary[] = []
  const baseline = buildPersonalBpBaseline(readings, voiceLogs, targetDate)

  for (let i = windowDays - 1; i >= 0; i--) {
    const date = offsetDateStr(targetDate, -i)
    const dayReadings = readings.filter((r) => dateStr(r.measuredAt) === date)
    if (dayReadings.length === 0) continue

    const sysVals = dayReadings.map((r) => r.systolicMmHg)
    const diaVals = dayReadings.map((r) => r.diastolicMmHg)
    const pulseVals = dayReadings.map((r) => r.pulseBpm).filter((v): v is number => v != null)

    const sysAvg = avg(sysVals)!
    const diaAvg = avg(diaVals)!
    const { morningSys } = morningEveningAvgs(dayReadings, voiceLogs)

    const prevDate = offsetDateStr(date, -1)
    const prevDay = readings.filter((r) => dateStr(r.measuredAt) === prevDate)
    const prevEvening = morningEveningAvgs(prevDay, voiceLogs).eveningSys

    let morningSurge = false
    if (morningSys != null) {
      if (prevEvening != null && morningSys - prevEvening > MORNING_SURGE_MMHG) {
        morningSurge = true
      } else if (
        baseline.eveningSysMedian != null &&
        baseline.eveningSysMedian > 0 &&
        (morningSys - baseline.eveningSysMedian) / baseline.eveningSysMedian > MORNING_SURGE_PCT
      ) {
        morningSurge = true
      }
    }

    summaries.push({
      date,
      sysAvg: Math.round(sysAvg * 10) / 10,
      diaAvg: Math.round(diaAvg * 10) / 10,
      pulseAvg: pulseVals.length > 0 ? Math.round(avg(pulseVals)! * 10) / 10 : undefined,
      pulsePressure: Math.round((sysAvg - diaAvg) * 10) / 10,
      readingCount: dayReadings.length,
      morningSurge,
    })
  }

  return summaries
}

export function countDaysWithReadings(
  readings: BloodPressureReading[],
  endDate: string,
  windowDays: number,
): number {
  const start = offsetDateStr(endDate, -(windowDays - 1))
  const dates = new Set<string>()
  for (const r of readings) {
    const d = dateStr(r.measuredAt)
    if (d >= start && d <= endDate) dates.add(d)
  }
  return dates.size
}

export function ewma(values: number[], alpha = 0.3): number | null {
  if (values.length === 0) return null
  let e = values[0]
  for (let i = 1; i < values.length; i++) {
    e = alpha * values[i] + (1 - alpha) * e
  }
  return e
}

export function dailySysSeries(
  summaries: DailyBpSummary[],
): { date: string; sysAvg: number }[] {
  return summaries.map((s) => ({ date: s.date, sysAvg: s.sysAvg }))
}

export function coefficientOfVariation(values: number[]): number | null {
  if (values.length < 2) return null
  const m = avg(values)!
  if (m === 0) return null
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length)
  return sd / m
}

export function pctDelta(value: number, baseline: number | null): number | null {
  if (baseline == null || baseline === 0) return null
  return (value - baseline) / baseline
}

export function inferReadingRhythm(
  readings: BloodPressureReading[],
  voiceLogs: VoiceExtraction[],
  endDate: string,
  windowDays = 7,
): import('../types/bpAdvisory').BpRhythm {
  const window = readingsInWindow(readings, endDate, windowDays)
  if (window.length === 0) return 'single_reading'
  if (window.length === 1) return 'single_reading'

  let hasMorning = false
  let hasEvening = false
  for (const r of window) {
    const ctx = deriveMeasurementContext(r, voiceLogs)
    if (ctx === 'morning') hasMorning = true
    if (ctx === 'evening') hasEvening = true
  }
  if (hasMorning && hasEvening) return 'mixed'
  if (hasMorning) return 'morning_only'
  if (hasEvening) return 'evening_only'
  return 'mixed'
}

export function detectDuplicateSuspect(readings: BloodPressureReading[]): boolean {
  const keys = new Set<string>()
  for (const r of readings) {
    const key = `${r.measuredAt.slice(0, 16)}|${r.systolicMmHg}|${r.diastolicMmHg}`
    if (keys.has(key)) return true
    keys.add(key)
  }
  return false
}

export function computeRhythmScore(
  days7d: number,
  rhythm: import('../types/bpAdvisory').BpRhythm,
): number {
  let score = Math.min(1, days7d / 7)
  if (rhythm === 'mixed') score = Math.min(1, score + 0.2)
  if (rhythm === 'single_reading') score *= 0.3
  return Math.round(score * 100) / 100
}

export function countGapDays7d(endDate: string, summaries: DailyBpSummary[]): number {
  const datesWith = new Set(summaries.map((s) => s.date))
  let gaps = 0
  for (let i = 6; i >= 0; i--) {
    const d = offsetDateStr(endDate, -i)
    if (!datesWith.has(d)) gaps += 1
  }
  return gaps
}
