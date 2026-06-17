import type { DailyWatchRow, PersonalBaseline } from '../../types/health'
import { emptyWatchRow } from '../../lib/health-import/watchRow'

export const BASELINES_FIXTURE: PersonalBaseline[] = [
  { metric: 'hrvSdnn', mean: 40, sd: 5, ewma: 40, nSamples: 14, maturityDays: 14 },
  { metric: 'restingHr', mean: 65, sd: 3, ewma: 65, nSamples: 14, maturityDays: 14 },
  { metric: 'wristTempRaw', mean: 35.0, sd: 0.1, ewma: 35, nSamples: 14, maturityDays: 14 },
  { metric: 'dailySteps', mean: 6000, sd: 1000, ewma: 6000, nSamples: 14, maturityDays: 14 },
]

function row(date: string, patch: Partial<DailyWatchRow>): DailyWatchRow {
  return { ...emptyWatchRow(date), ...patch }
}

/** 短睡眠 + HRV 低 + RHR 高 → rainy */
export const RAINY_DAY = row('2026-06-09', {
  sleepHours: 5.2,
  hrvSdnn: 30,
  restingHr: 72,
  dailySteps: 5000,
})

export const YESTERDAY_EXERCISE = row('2026-06-08', {
  exerciseMinutes: 60,
  sleepHours: 7,
  hrvSdnn: 38,
  restingHr: 64,
})

/** 运动后 HRV 仍低 → rainbow */
export const RAINBOW_DAY = row('2026-06-09', {
  exerciseMinutes: 20,
  sleepHours: 7.5,
  hrvSdnn: 32,
  restingHr: 66,
  dailySteps: 7000,
})

/** 全面良好 → sunny */
export const SUNNY_DAY = row('2026-06-10', {
  sleepHours: 7.8,
  hrvSdnn: 42,
  restingHr: 63,
  dailySteps: 8500,
  exerciseMinutes: 30,
})

export const ROWS_RAINY: DailyWatchRow[] = [YESTERDAY_EXERCISE, RAINY_DAY]
export const ROWS_RAINBOW: DailyWatchRow[] = [YESTERDAY_EXERCISE, RAINBOW_DAY]
export const ROWS_SUNNY: DailyWatchRow[] = [SUNNY_DAY]
