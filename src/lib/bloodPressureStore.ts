import type { VoiceExtraction } from '../types/voice'
import type {
  BloodPressureReading,
  BloodPressureSource,
  FoodFingerprint,
  FoodFingerprintReaction,
} from '../types/bloodPressure'
import {
  BP_DIASTOLIC_MAX,
  BP_DIASTOLIC_MIN,
  BP_PULSE_MAX,
  BP_PULSE_MIN,
  BP_SYSTOLIC_MAX,
  BP_SYSTOLIC_MIN,
} from '../types/bloodPressure'

const STORAGE_KEY = 'subhealth_bp_readings'
const LEGACY_GLUCOSE_KEY = 'subhealth_glucose_readings'
export const POST_MEAL_WINDOW_MS = 2 * 60 * 60 * 1000

export function loadBloodPressureReadings(): BloodPressureReading[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BloodPressureReading[]
    return Array.isArray(parsed)
      ? parsed.sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
      : []
  } catch {
    return []
  }
}

function saveBloodPressureReadings(readings: BloodPressureReading[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(readings.sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))),
    )
  } catch {
    // ignore
  }
}

export function clearBloodPressureReadings(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LEGACY_GLUCOSE_KEY)
}

export interface AddBloodPressureInput {
  measuredAt: string
  systolicMmHg: number
  diastolicMmHg: number
  pulseBpm?: number
  source?: BloodPressureSource
  voiceLogId?: string
  note?: string
}

function isValidReading(input: AddBloodPressureInput): boolean {
  const sys = Number(input.systolicMmHg)
  const dia = Number(input.diastolicMmHg)
  if (
    !Number.isFinite(sys) ||
    !Number.isFinite(dia) ||
    sys < BP_SYSTOLIC_MIN ||
    sys > BP_SYSTOLIC_MAX ||
    dia < BP_DIASTOLIC_MIN ||
    dia > BP_DIASTOLIC_MAX ||
    dia > sys
  ) {
    return false
  }
  if (input.pulseBpm != null) {
    const pulse = Number(input.pulseBpm)
    if (!Number.isFinite(pulse) || pulse < BP_PULSE_MIN || pulse > BP_PULSE_MAX) {
      return false
    }
  }
  return Boolean(input.measuredAt.trim())
}

export function addBloodPressureReading(input: AddBloodPressureInput): BloodPressureReading | null {
  if (!isValidReading(input)) return null

  const measuredAt = input.measuredAt.trim()
  const reading: BloodPressureReading = {
    id: crypto.randomUUID(),
    measuredAt: measuredAt.includes('T') ? measuredAt : `${measuredAt}T12:00:00`,
    systolicMmHg: Math.round(Number(input.systolicMmHg)),
    diastolicMmHg: Math.round(Number(input.diastolicMmHg)),
    pulseBpm:
      input.pulseBpm != null && Number.isFinite(Number(input.pulseBpm))
        ? Math.round(Number(input.pulseBpm))
        : undefined,
    source: input.source ?? 'manual',
    voiceLogId: input.voiceLogId,
    note: input.note?.trim() || undefined,
  }

  saveBloodPressureReadings([...loadBloodPressureReadings(), reading])
  return reading
}

export function deleteBloodPressureReading(id: string): void {
  saveBloodPressureReadings(loadBloodPressureReadings().filter((r) => r.id !== id))
}

function readingKey(r: BloodPressureReading): string {
  return `${r.measuredAt}|${r.systolicMmHg}|${r.diastolicMmHg}`
}

export function importBloodPressureReadings(incoming: BloodPressureReading[]): number {
  const existing = loadBloodPressureReadings()
  const keys = new Set(existing.map(readingKey))
  let added = 0
  const merged = [...existing]
  for (const r of incoming) {
    const key = readingKey(r)
    if (keys.has(key)) continue
    keys.add(key)
    merged.push(r)
    added += 1
  }
  saveBloodPressureReadings(merged)
  return added
}

export function mergeBloodPressureReadings(incoming: BloodPressureReading[]): number {
  return importBloodPressureReadings(incoming)
}

export function getReadingsForDate(dateStr: string): BloodPressureReading[] {
  return loadBloodPressureReadings().filter((r) => r.measuredAt.slice(0, 10) === dateStr)
}

export function getReadingsInRange(startDate: string, endDate: string): BloodPressureReading[] {
  return loadBloodPressureReadings().filter((r) => {
    const d = r.measuredAt.slice(0, 10)
    return d >= startDate && d <= endDate
  })
}

function median(vals: number[]): number | null {
  if (vals.length === 0) return null
  const sorted = [...vals].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function mealTimestamp(log: VoiceExtraction): number {
  return new Date(log.timestamp).getTime()
}

export function peakSystolicInWindow(
  readings: BloodPressureReading[],
  startMs: number,
  endMs: number,
): number | null {
  const peaks = readings
    .filter((r) => {
      const t = new Date(r.measuredAt).getTime()
      return t >= startMs && t <= endMs
    })
    .map((r) => r.systolicMmHg)
  if (peaks.length === 0) return null
  return Math.max(...peaks)
}

export function computePostMealSystolicPeaks(
  voiceLogs: VoiceExtraction[],
  readings: BloodPressureReading[],
): number[] {
  const peaks: number[] = []
  for (const log of voiceLogs) {
    const start = mealTimestamp(log)
    if (Number.isNaN(start)) continue
    const peak = peakSystolicInWindow(readings, start, start + POST_MEAL_WINDOW_MS)
    if (peak != null) peaks.push(peak)
  }
  return peaks
}

export function personalPostMealSystolicMedian(
  voiceLogs: VoiceExtraction[],
  readings: BloodPressureReading[],
): number | null {
  return median(computePostMealSystolicPeaks(voiceLogs, readings))
}

export function hasElevatedPostMealBp(
  date: string,
  voiceLogs: VoiceExtraction[],
  readings: BloodPressureReading[],
  mealSlotFilter?: VoiceExtraction['mealSlot'],
): boolean {
  const med = personalPostMealSystolicMedian(voiceLogs, readings)
  if (med == null || med <= 0) return false

  const dayLogs = voiceLogs.filter(
    (l) => l.recordDate === date && (!mealSlotFilter || l.mealSlot === mealSlotFilter),
  )

  for (const log of dayLogs) {
    const start = mealTimestamp(log)
    if (Number.isNaN(start)) continue
    const peak = peakSystolicInWindow(readings, start, start + POST_MEAL_WINDOW_MS)
    if (peak != null && peak > med * 1.1) return true
  }
  return false
}

function reactionFromDelta(delta: number): FoodFingerprintReaction {
  if (delta > 0.15) return 'strong'
  if (delta > 0.08) return 'moderate'
  return 'mild'
}

export function computeFoodFingerprints(
  voiceLogs: VoiceExtraction[],
  readings: BloodPressureReading[],
): FoodFingerprint[] {
  const med = personalPostMealSystolicMedian(voiceLogs, readings)
  if (med == null || med <= 0) return []

  const byFood = new Map<string, { peaks: number[]; lastAt: string }>()

  for (const log of voiceLogs) {
    const start = mealTimestamp(log)
    if (Number.isNaN(start)) continue
    const peak = peakSystolicInWindow(readings, start, start + POST_MEAL_WINDOW_MS)
    if (peak == null) continue

    for (const food of log.foods) {
      const key = food.name.trim()
      if (!key) continue
      const entry = byFood.get(key) ?? { peaks: [], lastAt: log.recordDate }
      entry.peaks.push(peak)
      if (log.recordDate > entry.lastAt) entry.lastAt = log.recordDate
      byFood.set(key, entry)
    }
  }

  const fingerprints: FoodFingerprint[] = []
  for (const [foodName, { peaks, lastAt }] of byFood) {
    if (peaks.length < 2) continue
    const avgPeak = peaks.reduce((a, b) => a + b, 0) / peaks.length
    const avgDelta = (avgPeak - med) / med
    fingerprints.push({
      foodName,
      sampleCount: peaks.length,
      avgPeakDeltaPct: Math.round(avgDelta * 100) / 100,
      reaction: reactionFromDelta(avgDelta),
      lastSeenAt: lastAt,
    })
  }

  return fingerprints.sort((a, b) => b.avgPeakDeltaPct - a.avgPeakDeltaPct)
}

export function hasBloodPressureData(): boolean {
  return loadBloodPressureReadings().length > 0
}

export function formatBloodPressure(r: BloodPressureReading): string {
  const pulse = r.pulseBpm != null ? ` · 脉 ${r.pulseBpm}` : ''
  return `${r.systolicMmHg}/${r.diastolicMmHg} mmHg${pulse}`
}
