import type { DailyWatchRow, PersonalBaseline } from '../types/health'
import { getBaseline } from './baselines'
import { computeDerived } from './health-import/xmlParser'

export interface WellnessSignals {
  date: string
  hrvRatio: number | null
  rhrDelta: number | null
  sleepHours: number | null
  awakeEpisodes: number | null
  wristTempDelta: number | null
  hrvIntradayCv: number | null
  hrvSdnn: number | null
  restingHr: number | null
  dailySteps: number | null
  exerciseMinutes: number | null
  yesterdayExercise: number | null
  stepsRatio: number | null
}

export function buildWellnessSignals(
  today: DailyWatchRow,
  yesterday: DailyWatchRow | null,
  baselines: PersonalBaseline[],
): WellnessSignals {
  const hrvBase = getBaseline(baselines, 'hrvSdnn')
  const rhrBase = getBaseline(baselines, 'restingHr')
  const wristBase = getBaseline(baselines, 'wristTempRaw')
  const stepsBase = getBaseline(baselines, 'dailySteps')

  const derived = computeDerived(today)

  const hrvRatio =
    today.hrvSdnn != null && hrvBase && hrvBase.mean > 0
      ? today.hrvSdnn / hrvBase.mean
      : null

  const rhrDelta =
    today.restingHr != null && rhrBase ? today.restingHr - rhrBase.mean : null

  const wristTempDelta =
    today.wristTempRaw != null && wristBase && wristBase.nSamples > 0
      ? today.wristTempRaw - wristBase.mean
      : null

  const stepsRatio =
    today.dailySteps != null && stepsBase && stepsBase.mean > 0
      ? today.dailySteps / stepsBase.mean
      : null

  return {
    date: today.date,
    hrvRatio,
    rhrDelta,
    sleepHours: today.sleepHours,
    awakeEpisodes: today.awakeEpisodes,
    wristTempDelta,
    hrvIntradayCv: derived.hrvIntradayCv,
    hrvSdnn: today.hrvSdnn,
    restingHr: today.restingHr,
    dailySteps: today.dailySteps,
    exerciseMinutes: today.exerciseMinutes,
    yesterdayExercise: yesterday?.exerciseMinutes ?? null,
    stepsRatio,
  }
}

export function getRowByDate(rows: DailyWatchRow[], date: string): DailyWatchRow | null {
  return rows.find((r) => r.date === date) ?? null
}

export function getYesterdayRow(rows: DailyWatchRow[], date: string): DailyWatchRow | null {
  const idx = rows.findIndex((r) => r.date === date)
  if (idx <= 0) return null
  return rows[idx - 1]
}

export function countConsecutiveDays(
  rows: DailyWatchRow[],
  endDate: string,
  predicate: (row: DailyWatchRow) => boolean,
  maxDays = 7,
): number {
  const endIdx = rows.findIndex((r) => r.date === endDate)
  if (endIdx < 0) return 0
  let count = 0
  for (let i = endIdx; i >= 0 && count < maxDays; i--) {
    if (predicate(rows[i])) count++
    else break
  }
  return count
}

export function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function pickLatestWatchDay(rows: DailyWatchRow[]): DailyWatchRow | null {
  if (rows.length === 0) return null
  return rows[rows.length - 1]
}
