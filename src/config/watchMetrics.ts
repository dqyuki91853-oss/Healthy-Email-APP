import type { DailyWatchRow } from '../types/health'

/** 所有 Apple Watch 指标索引 — 每条日记录必须包含这些 rowKey，无数据则为 null / [] */
export interface WatchMetricIndexEntry {
  /** 逻辑指标 key（与 reliability 配置对齐） */
  key: string
  /** DailyWatchRow 字段名 */
  rowKey: keyof DailyWatchRow
  label: string
  unit?: string
  healthKitType: string
  /** scalar | cumulative | array | category */
  valueKind: 'scalar' | 'cumulative' | 'array' | 'category'
}

export const WATCH_METRIC_INDEX: WatchMetricIndexEntry[] = [
  { key: 'dailySteps', rowKey: 'dailySteps', label: '步数', unit: '步', healthKitType: 'HKQuantityTypeIdentifierStepCount', valueKind: 'cumulative' },
  { key: 'activeEnergyKcal', rowKey: 'activeEnergyKcal', label: '活动能量', unit: 'kcal', healthKitType: 'HKQuantityTypeIdentifierActiveEnergyBurned', valueKind: 'cumulative' },
  { key: 'exerciseMinutes', rowKey: 'exerciseMinutes', label: '运动分钟', unit: 'min', healthKitType: 'HKQuantityTypeIdentifierAppleExerciseTime', valueKind: 'cumulative' },
  { key: 'restingHr', rowKey: 'restingHr', label: '静息心率', unit: 'bpm', healthKitType: 'HKQuantityTypeIdentifierRestingHeartRate', valueKind: 'scalar' },
  { key: 'hrvSdnn', rowKey: 'hrvSdnn', label: 'HRV SDNN', unit: 'ms', healthKitType: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN', valueKind: 'scalar' },
  { key: 'hrvReadings', rowKey: 'hrvReadings', label: 'HRV 读数序列', healthKitType: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN', valueKind: 'array' },
  { key: 'spo2', rowKey: 'spo2Readings', label: '血氧 SpO₂', unit: '%', healthKitType: 'HKQuantityTypeIdentifierOxygenSaturation', valueKind: 'array' },
  { key: 'spo2DesatEvents', rowKey: 'spo2DesatEvents', label: '血氧脱饱和事件', healthKitType: 'HKQuantityTypeIdentifierOxygenSaturation', valueKind: 'scalar' },
  { key: 'vo2max', rowKey: 'vo2max', label: 'VO₂ max', unit: 'mL/kg/min', healthKitType: 'HKQuantityTypeIdentifierVO2Max', valueKind: 'scalar' },
  { key: 'cardioRecovery', rowKey: 'cardioRecovery1min', label: '心率恢复', unit: 'bpm', healthKitType: 'HKQuantityTypeIdentifierHeartRateRecoveryOneMinute', valueKind: 'scalar' },
  { key: 'respiratoryRate', rowKey: 'respiratoryRateSleep', label: '呼吸频率（睡眠）', unit: '次/分', healthKitType: 'HKQuantityTypeIdentifierRespiratoryRate', valueKind: 'scalar' },
  { key: 'wristTemp', rowKey: 'wristTempRaw', label: '手腕温度', unit: '°C', healthKitType: 'HKQuantityTypeIdentifierAppleSleepingWristTemperature', valueKind: 'scalar' },
  { key: 'walkingAsymmetry', rowKey: 'walkingAsymmetryPct', label: '步态不对称', unit: '%', healthKitType: 'HKQuantityTypeIdentifierWalkingAsymmetryPercentage', valueKind: 'scalar' },
  { key: 'walkingSteadiness', rowKey: 'walkingSteadiness', label: '步态稳定性', healthKitType: 'HKCategoryTypeIdentifierAppleWalkingSteadiness', valueKind: 'category' },
  { key: 'daylight', rowKey: 'daylightMinutes', label: '日照时间', unit: 'min', healthKitType: 'HKQuantityTypeIdentifierTimeInDaylight', valueKind: 'cumulative' },
  { key: 'environmentalNoise', rowKey: 'environmentalNoiseDb', label: '环境噪声', unit: 'dB', healthKitType: 'HKQuantityTypeIdentifierEnvironmentalSoundPressureLevel', valueKind: 'scalar' },
  { key: 'sleepHours', rowKey: 'sleepHours', label: '睡眠时长', unit: 'h', healthKitType: 'HKCategoryTypeIdentifierSleepAnalysis', valueKind: 'cumulative' },
  { key: 'deepSleepMin', rowKey: 'deepSleepMin', label: '深睡', unit: 'min', healthKitType: 'HKCategoryTypeIdentifierSleepAnalysis', valueKind: 'cumulative' },
  { key: 'remSleepMin', rowKey: 'remSleepMin', label: 'REM 睡眠', unit: 'min', healthKitType: 'HKCategoryTypeIdentifierSleepAnalysis', valueKind: 'cumulative' },
  { key: 'coreSleepMin', rowKey: 'coreSleepMin', label: '核心睡眠', unit: 'min', healthKitType: 'HKCategoryTypeIdentifierSleepAnalysis', valueKind: 'cumulative' },
  { key: 'inBedMin', rowKey: 'inBedMin', label: '卧床', unit: 'min', healthKitType: 'HKCategoryTypeIdentifierSleepAnalysis', valueKind: 'cumulative' },
  { key: 'awakeEpisodes', rowKey: 'awakeEpisodes', label: '夜间清醒次数', healthKitType: 'HKCategoryTypeIdentifierSleepAnalysis', valueKind: 'scalar' },
]

export const WATCH_ROW_KEYS = WATCH_METRIC_INDEX.map((m) => m.rowKey)
