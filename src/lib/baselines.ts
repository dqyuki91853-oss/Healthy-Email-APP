import type { DailyWatchRow, PersonalBaseline } from '../types/health'

const BASELINE_DAYS = 42
const EWMA_ALPHA = 0.1

function mean(vals: number[]): number {
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function sd(vals: number[], m: number): number {
  if (vals.length < 2) return 0
  const v = vals.reduce((s, x) => s + (x - m) ** 2, 0) / vals.length
  return Math.sqrt(v)
}

function ewma(vals: number[]): number {
  if (vals.length === 0) return 0
  let e = vals[0]
  for (let i = 1; i < vals.length; i++) {
    e = EWMA_ALPHA * vals[i] + (1 - EWMA_ALPHA) * e
  }
  return e
}

type MetricExtractor = (row: DailyWatchRow) => number | null

const METRICS: { key: string; extract: MetricExtractor }[] = [
  { key: 'dailySteps', extract: (r) => r.dailySteps },
  { key: 'restingHr', extract: (r) => r.restingHr },
  { key: 'hrvSdnn', extract: (r) => r.hrvSdnn },
  { key: 'sleepHours', extract: (r) => r.sleepHours },
  { key: 'vo2max', extract: (r) => r.vo2max },
  { key: 'exerciseMinutes', extract: (r) => r.exerciseMinutes },
  { key: 'wristTempRaw', extract: (r) => r.wristTempRaw },
]

export function computeBaselines(rows: DailyWatchRow[]): PersonalBaseline[] {
  const window = rows.slice(-BASELINE_DAYS)
  const maturityDays = window.length

  return METRICS.map(({ key, extract }) => {
    const vals = window.map(extract).filter((v): v is number => v != null)
    const m = vals.length > 0 ? mean(vals) : 0
    return {
      metric: key,
      mean: m,
      sd: sd(vals, m),
      ewma: ewma(vals),
      nSamples: vals.length,
      maturityDays,
    }
  })
}

export function getBaseline(baselines: PersonalBaseline[], metric: string): PersonalBaseline | undefined {
  return baselines.find((b) => b.metric === metric)
}

export function movingAverage(vals: number[], window: number): number[] {
  const result: number[] = []
  for (let i = 0; i < vals.length; i++) {
    const start = Math.max(0, i - window + 1)
    const slice = vals.slice(start, i + 1)
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length)
  }
  return result
}

export function trendSlope(vals: number[], windowDays: number): number {
  const slice = vals.slice(-windowDays)
  if (slice.length < 2) return 0
  const n = slice.length
  const xs = slice.map((_, i) => i)
  const xMean = mean(xs)
  const yMean = mean(slice)
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (slice[i] - yMean)
    den += (xs[i] - xMean) ** 2
  }
  return den === 0 ? 0 : num / den
}
