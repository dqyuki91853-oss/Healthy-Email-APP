import type { DailyWatchRow } from '../../types/health'
import { emptyRowFromCsv } from './csvHelpers'

export function parseHealthCsv(text: string): DailyWatchRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) throw new Error('CSV 文件为空或格式不正确')

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const dateIdx = headers.findIndex((h) => ['date', '日期', 'day'].includes(h))
  if (dateIdx < 0) throw new Error('CSV 需包含 date/日期 列')

  const colMap: Record<string, number> = {}
  const aliases: Record<keyof DailyWatchRow, string[]> = {
    date: ['date', '日期'],
    dailySteps: ['steps', 'step_count', '步数', 'dailysteps'],
    restingHr: ['resting_hr', 'rhr', '静息心率', 'restinghr'],
    hrvSdnn: ['hrv', 'sdnn', 'hrv_sdnn'],
    sleepHours: ['sleep_hours', 'sleep', '睡眠'],
    vo2max: ['vo2max', 'vo2_max'],
    exerciseMinutes: ['exercise_minutes', 'exercise'],
    activeEnergyKcal: ['active_energy', 'energy'],
    deepSleepMin: ['deep_sleep_min'],
    remSleepMin: ['rem_sleep_min'],
    coreSleepMin: ['core_sleep_min'],
    inBedMin: ['in_bed_min'],
    awakeEpisodes: ['awake_episodes'],
    spo2Readings: [],
    hrvReadings: [],
    spo2DesatEvents: ['spo2_desat', 'spo2desatevents'],
    respiratoryRateSleep: ['respiratory_rate', 'respiratoryratesleep'],
    walkingAsymmetryPct: ['walking_asymmetry', 'walkingasymmetrypct'],
    walkingSteadiness: ['walking_steadiness', 'walkingsteadiness'],
    wristTempRaw: ['wrist_temp', 'wristtempraw'],
    cardioRecovery1min: ['cardio_recovery', 'cardiorecovery1min'],
    daylightMinutes: ['daylight', 'daylightminutes'],
    environmentalNoiseDb: ['environmental_noise', 'environmentalnoisedb'],
  }

  for (const [field, names] of Object.entries(aliases)) {
    const idx = headers.findIndex((h) => names.includes(h))
    if (idx >= 0) colMap[field] = idx
  }

  const rows: DailyWatchRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    const date = cols[dateIdx]
    if (!date) continue
    rows.push(emptyRowFromCsv(date, cols, colMap))
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date))
}
