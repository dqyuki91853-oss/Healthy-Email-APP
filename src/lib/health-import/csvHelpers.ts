import type { DailyWatchRow, WalkingSteadiness } from '../../types/health'
import { normalizeWatchRow } from './watchRow'

export function emptyRowFromCsv(
  date: string,
  cols: string[],
  colMap: Record<string, number>,
): DailyWatchRow {
  const num = (field: string): number | null => {
    const idx = colMap[field]
    if (idx == null) return null
    const v = parseFloat(cols[idx])
    return isNaN(v) ? null : v
  }

  const str = (field: string): string | null => {
    const idx = colMap[field]
    if (idx == null) return null
    const v = cols[idx]?.trim()
    return v || null
  }

  const steadiness = str('walkingSteadiness')
  const walkingSteadiness =
    steadiness === 'normal' || steadiness === 'low' || steadiness === 'very_low'
      ? (steadiness as WalkingSteadiness)
      : null

  return normalizeWatchRow({
    date,
    dailySteps: num('dailySteps'),
    activeEnergyKcal: num('activeEnergyKcal'),
    exerciseMinutes: num('exerciseMinutes'),
    restingHr: num('restingHr'),
    hrvSdnn: num('hrvSdnn'),
    hrvReadings: num('hrvSdnn') != null ? [num('hrvSdnn')!] : [],
    spo2Readings: [],
    spo2DesatEvents: num('spo2DesatEvents'),
    respiratoryRateSleep: num('respiratoryRateSleep'),
    walkingAsymmetryPct: num('walkingAsymmetryPct'),
    walkingSteadiness,
    wristTempRaw: num('wristTempRaw'),
    sleepHours: num('sleepHours'),
    deepSleepMin: num('deepSleepMin'),
    remSleepMin: num('remSleepMin'),
    coreSleepMin: num('coreSleepMin'),
    inBedMin: num('inBedMin'),
    awakeEpisodes: num('awakeEpisodes') != null ? Math.round(num('awakeEpisodes')!) : null,
    vo2max: num('vo2max'),
    cardioRecovery1min: num('cardioRecovery1min'),
    daylightMinutes: num('daylightMinutes'),
    environmentalNoiseDb: num('environmentalNoiseDb'),
  })
}
