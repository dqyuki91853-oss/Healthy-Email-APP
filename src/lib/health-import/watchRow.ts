import type { DailyWatchRow } from '../../types/health'

/** 空日记录：所有指标键齐全，无数据为 null / [] */
export function emptyWatchRow(date: string): DailyWatchRow {
  return {
    date,
    dailySteps: null,
    activeEnergyKcal: null,
    exerciseMinutes: null,
    restingHr: null,
    hrvSdnn: null,
    hrvReadings: [],
    spo2Readings: [],
    spo2DesatEvents: null,
    respiratoryRateSleep: null,
    walkingAsymmetryPct: null,
    walkingSteadiness: null,
    wristTempRaw: null,
    sleepHours: null,
    deepSleepMin: null,
    remSleepMin: null,
    coreSleepMin: null,
    inBedMin: null,
    awakeEpisodes: null,
    vo2max: null,
    cardioRecovery1min: null,
    daylightMinutes: null,
    environmentalNoiseDb: null,
  }
}

export function addCumulative(
  row: DailyWatchRow,
  field: 'dailySteps' | 'activeEnergyKcal' | 'exerciseMinutes' | 'daylightMinutes',
  value: number,
): void {
  row[field] = (row[field] ?? 0) + value
}

export function addSleepMinutes(
  row: DailyWatchRow,
  field: 'sleepHours' | 'deepSleepMin' | 'remSleepMin' | 'coreSleepMin' | 'inBedMin',
  minutes: number,
): void {
  if (field === 'sleepHours') {
    row.sleepHours = (row.sleepHours ?? 0) + minutes / 60
  } else {
    row[field] = (row[field] ?? 0) + minutes
  }
}

export function incrementCount(
  row: DailyWatchRow,
  field: 'spo2DesatEvents' | 'awakeEpisodes',
): void {
  row[field] = (row[field] ?? 0) + 1
}

/** 确保每条记录包含全部指标键；未采集的标量保持 null */
export function normalizeWatchRow(row: Partial<DailyWatchRow> & { date: string }): DailyWatchRow {
  const base = emptyWatchRow(row.date)
  const merged: DailyWatchRow = {
    ...base,
    ...row,
    hrvReadings: row.hrvReadings ?? [],
    spo2Readings: row.spo2Readings ?? [],
  }

  if (merged.spo2Readings.length === 0) {
    merged.spo2DesatEvents = merged.spo2DesatEvents ?? null
  }

  if (merged.sleepHours == null && merged.inBedMin == null) {
    merged.awakeEpisodes = merged.awakeEpisodes ?? null
    merged.deepSleepMin = merged.deepSleepMin ?? null
    merged.remSleepMin = merged.remSleepMin ?? null
    merged.coreSleepMin = merged.coreSleepMin ?? null
  }

  if (merged.hrvReadings.length === 0) {
    merged.hrvSdnn = merged.hrvSdnn ?? null
  }

  if (merged.sleepHours != null) {
    merged.sleepHours = Math.round(merged.sleepHours * 100) / 100
  }

  return merged
}
