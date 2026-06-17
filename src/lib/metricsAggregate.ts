import type { DailyWatchRow } from '../types/health'
import { computeDerived } from './health-import/xmlParser'

export function recentValues(
  rows: DailyWatchRow[],
  extract: (r: DailyWatchRow) => number | null | undefined,
  days: number,
): number[] {
  return rows
    .slice(-days)
    .map(extract)
    .filter((v): v is number => v != null && !Number.isNaN(v))
}

export function avg(vals: number[]): number | null {
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function min(vals: number[]): number | null {
  if (!vals.length) return null
  return Math.min(...vals)
}

export function max(vals: number[]): number | null {
  if (!vals.length) return null
  return Math.max(...vals)
}

export function trendDelta(vals: number[]): number | null {
  if (vals.length < 2) return null
  return vals[vals.length - 1] - vals[0]
}

export function wristTempAmplitude(rows: DailyWatchRow[], days = 90): number | null {
  const temps = recentValues(rows, (r) => r.wristTempRaw, days)
  if (temps.length < 5) return null
  return max(temps)! - min(temps)!
}

export function spo2NightAvgSeries(rows: DailyWatchRow[], days: number): number[] {
  return rows.slice(-days).map((r) => {
    if (!r.spo2Readings.length) return null
    return r.spo2Readings.reduce((a, b) => a + b, 0) / r.spo2Readings.length
  }).filter((v): v is number => v != null)
}

export function derivedSeries(rows: DailyWatchRow[], days: number) {
  return rows.slice(-days).map((r) => computeDerived(r))
}

export function bmi(weightKg?: number, heightCm?: number): number | null {
  if (!weightKg || !heightCm) return null
  return weightKg / (heightCm / 100) ** 2
}
