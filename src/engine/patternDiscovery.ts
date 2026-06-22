import type { ConfidenceLevel } from '../types/bodyWeather'
import type { DailyWatchRow } from '../types/health'
import type { CaseFile, CaseFileKind, PatternDiscoveryResult } from '../types/caseFile'
import type { VoiceExtraction } from '../types/voice'

const MIN_DAYS = 14
const MAX_NEW_PER_WEEK = 2

type CaseFileDraft = Omit<CaseFile, 'id' | 'displayNumber' | 'discoveredAt' | 'status'>

function weekKey(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  return monday.toISOString().slice(0, 10)
}

function pearsonR(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 2) return null
  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const vx = xs[i] - mx
    const vy = ys[i] - my
    num += vx * vy
    dx += vx * vx
    dy += vy * vy
  }
  const den = Math.sqrt(dx * dy)
  if (den === 0) return null
  return num / den
}

function stdDev(vals: number[]): number {
  if (vals.length < 2) return 0
  const m = vals.reduce((a, b) => a + b, 0) / vals.length
  const v = vals.reduce((s, x) => s + (x - m) ** 2, 0) / vals.length
  return Math.sqrt(v)
}

function nextDisplayNumber(cases: CaseFile[]): number {
  const max = cases.reduce((m, c) => Math.max(m, c.displayNumber), 0)
  return max + 1
}

function hasOpenKind(cases: CaseFile[], kind: CaseFileKind): boolean {
  return cases.some(
    (c) => c.kind === kind && (c.status === 'open' || c.status === 'testing'),
  )
}

function countNewThisWeek(cases: CaseFile[], targetDate: string): number {
  const wk = weekKey(targetDate)
  return cases.filter((c) => weekKey(c.discoveredAt) === wk).length
}

function makeCase(
  partial: CaseFileDraft,
  displayNumber: number,
  targetDate: string,
): CaseFile {
  return {
    ...partial,
    id: `case-${partial.kind}-${targetDate}-${displayNumber}`,
    displayNumber,
    discoveredAt: targetDate,
    status: 'open',
  }
}

function ruleSundayHrv(rows: DailyWatchRow[]): CaseFileDraft | null {
  const withHrv = rows.filter((r) => r.hrvSdnn != null)
  if (withHrv.length < 14) return null

  const sunday: number[] = []
  const other: number[] = []
  for (const r of withHrv) {
    const dow = new Date(`${r.date}T12:00:00`).getDay()
    if (dow === 0) sunday.push(r.hrvSdnn!)
    else other.push(r.hrvSdnn!)
  }
  if (sunday.length < 6) return null

  const sundayMean = sunday.reduce((a, b) => a + b, 0) / sunday.length
  const otherMean = other.reduce((a, b) => a + b, 0) / other.length
  const allSd = stdDev(withHrv.map((r) => r.hrvSdnn!))
  const diff = otherMean - sundayMean

  if (diff <= allSd * 0.15) return null

  const confidence: ConfidenceLevel = sunday.length >= 10 ? 'high' : 'medium'
  return {
    kind: 'weekday_pattern',
    title: '周日 HRV 常偏低',
    hypothesis:
      '近一段时间里，周日的 HRV 平均低于其他日子，可能与前一晚作息或周中压力有关。',
    evidence: [
      { label: '配对样本', value: `${withHrv.length} 天` },
      { label: '周日样本', value: `${sunday.length} 天` },
      { label: '说明', value: '个体差异模式，非诊断' },
    ],
    confidence,
    ruleId: 'PD-R1-sunday-hrv',
    metricKeys: ['hrvSdnn'],
  }
}

function ruleSleepHrvCorrelation(rows: DailyWatchRow[]): CaseFileDraft | null {
  const pairs = rows.filter((r) => r.hrvSdnn != null && r.sleepHours != null)
  if (pairs.length < 14) return null

  const sleep = pairs.map((r) => r.sleepHours!)
  const hrv = pairs.map((r) => r.hrvSdnn!)
  const r = pearsonR(sleep, hrv)
  if (r == null || r <= 0.45) return null

  return {
    kind: 'sleep_hrv_correlation',
    title: '睡得够，HRV 往往更好',
    hypothesis: '在你自己的记录里，睡眠时长与 HRV 呈正相关——睡得好时，恢复信号也更友好。',
    evidence: [
      { label: '相关系数', value: `r≈${r.toFixed(2)}` },
      { label: '样本', value: `n=${pairs.length} 天` },
      { label: '说明', value: '个体差异模式，非诊断' },
    ],
    confidence: pairs.length >= 21 ? 'high' : 'medium',
    ruleId: 'PD-R2-sleep-hrv',
    metricKeys: ['sleepHours', 'hrvSdnn'],
  }
}

function dinnerHour(log: VoiceExtraction): number | null {
  const d = new Date(log.timestamp)
  if (Number.isNaN(d.getTime())) return null
  return d.getHours() + d.getMinutes() / 60
}

function isLateDinnerLog(log: VoiceExtraction): boolean {
  if (log.mealSlot !== 'dinner') return false
  const h = dinnerHour(log)
  return h != null && h >= 20.5
}

function ruleLateDinnerSleep(
  rows: DailyWatchRow[],
  voiceLogs: VoiceExtraction[],
): CaseFileDraft | null {
  const lateDates = new Set<string>()
  for (const log of voiceLogs) {
    if (isLateDinnerLog(log)) lateDates.add(log.recordDate)
  }
  if (lateDates.size < 4) return null

  const lateSleep: number[] = []
  const earlySleep: number[] = []
  for (const r of rows) {
    if (r.sleepHours == null) continue
    if (lateDates.has(r.date)) lateSleep.push(r.sleepHours)
    else earlySleep.push(r.sleepHours)
  }
  if (lateSleep.length < 4 || earlySleep.length < 4) return null

  const lateMean = lateSleep.reduce((a, b) => a + b, 0) / lateSleep.length
  const earlyMean = earlySleep.reduce((a, b) => a + b, 0) / earlySleep.length
  if (earlyMean - lateMean < 0.5) return null

  return {
    kind: 'late_dinner_sleep',
    title: '晚餐偏晚的日子，睡眠偏短',
    hypothesis: '晚餐记录偏晚的那些天，你更容易睡不够——对身体来说，收工时间也许可以往前挪一点。',
    evidence: [
      { label: '偏晚晚餐日', value: `${lateSleep.length} 天` },
      { label: '睡眠差值', value: `约 ${(earlyMean - lateMean).toFixed(1)}h` },
      { label: '说明', value: '个体差异模式，非诊断' },
    ],
    confidence: lateSleep.length >= 10 ? 'medium' : 'low',
    ruleId: 'PD-R3-late-dinner',
    metricKeys: ['sleepHours'],
  }
}

export function discoverPatterns(
  rows: DailyWatchRow[],
  voiceLogs: VoiceExtraction[],
  existingCases: CaseFile[],
  targetDate: string,
): PatternDiscoveryResult {
  const daysAvailable = rows.length
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))

  if (daysAvailable < MIN_DAYS) {
    return {
      date: targetDate,
      newCases: [],
      activeCases: existingCases,
      insufficientData: true,
      minDaysRequired: MIN_DAYS,
      daysAvailable,
    }
  }

  const candidates: CaseFileDraft[] = []
  const r1 = ruleSundayHrv(sorted)
  if (r1 && !hasOpenKind(existingCases, r1.kind)) candidates.push(r1)
  const r2 = ruleSleepHrvCorrelation(sorted)
  if (r2 && !hasOpenKind(existingCases, r2.kind)) candidates.push(r2)
  const r3 = ruleLateDinnerSleep(sorted, voiceLogs)
  if (r3 && !hasOpenKind(existingCases, r3.kind)) candidates.push(r3)

  let weeklyCount = countNewThisWeek(existingCases, targetDate)
  const newCases: CaseFile[] = []
  let displayNum = nextDisplayNumber(existingCases)

  for (const c of candidates) {
    if (weeklyCount >= MAX_NEW_PER_WEEK) break
    newCases.push(makeCase(c, displayNum++, targetDate))
    weeklyCount++
  }

  const activeCases = [...existingCases, ...newCases]

  return {
    date: targetDate,
    newCases,
    activeCases,
    insufficientData: false,
    minDaysRequired: MIN_DAYS,
    daysAvailable,
  }
}
